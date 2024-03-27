import { HtmlParser, RecursiveVisitor, visitAll, Attribute, Element } from '@angular/compiler';

const uiRouterAttribute = [
	'uiSref',
	'uiParams',
	'uiSrefActiveEq',
	'uiSrefActive',
	'ui-view' // this is the same as the component <ui-view>
] as const

export function parseHtml(html: string, path?: string) {
	// https://github.com/angular/angular/blob/d15dca054c25c5bf9066930328c6b4d5889be017/packages/core/schematics/migrations/block-template-entities/util.ts#L125
	try {
		const parsed = new HtmlParser().parse(html, path ?? '', {
			// Allows for ICUs to be parsed.
			tokenizeExpansionForms: true,
			// Explicitly disable blocks so that their characters are treated as plain text.
			tokenizeBlocks: false,
		});

		if (parsed.errors.length === 0) {
			return parsed.rootNodes;
		}
		return [];
	} catch {
		return []
	}
}

export function migrateHtml(html: string, astNode: ReturnType<typeof parseHtml>): string {
	let result = html;

	class TextRangeCollector extends RecursiveVisitor {
		readonly textRanges: { node: Attribute | Element, range: [number, number], parent?: Element }[] = [];

		override visitAttribute(attr: Attribute, context: Element) {
			if (uiRouterAttribute.includes(attr.name as any)) {
				// we only want to include where matching so we are not wasting time looping through unwanted attributes
				this.textRanges.push({
					node: attr,
					range: [
						attr.sourceSpan.start.offset,
						attr.sourceSpan.end.offset
					],
					parent: attr.name === 'ui-view' ? context : undefined
				});
			}
			super.visitAttribute(attr, context)
		}

		override visitElement(ele: Element, context: any) {
			if (ele.name === 'ui-router') {
				this.textRanges.push({
					node: ele,
					range: [
						ele.sourceSpan.start.offset,
						ele.sourceSpan.end.offset
					]
				});
			}
			visitAll(this, ele.attrs, ele);
			visitAll(this, ele.children);
		}

	}

	const visitor = new TextRangeCollector();
	visitAll(visitor, astNode);
	const sortedRanges = visitor.textRanges.sort((a, b) => b.range[0] - a.range[0]);

	for (const { node, range: [start, end], parent } of sortedRanges) {
		let replaced;
		if (node instanceof Attribute) {
			// Check if the node is an Attribute and specifically if it's 'ui-view'
			if (node.name === 'ui-view' && parent) {
				const additionalReplacement = node.value ? `[name]="${node.value}"` : '';
				const parentStart = parent.sourceSpan.start.offset;
				const parentEnd = parent.sourceSpan.end.offset;
				const parentReplacement = replaceParentElement(parent, result.substring(parentStart, parentEnd), additionalReplacement);
				result = `${result.substring(0, parentStart)}${parentReplacement}${result.substring(parentEnd)}`;
				continue;
			} else {
				replaced = handleAttribute(node, result.substring(start, end));
			}
		} else if (node instanceof Element) {
			replaced = handleElement(node, result.substring(start, end));
		}

		if (replaced !== undefined) {
			result = `${result.substring(0, start)}${replaced}${result.substring(end)}`;
		}
	}

	return result;
}

function handleAttribute(attribute: Attribute, text: string): string {
	switch (attribute.name as (typeof uiRouterAttribute)[number]) {
		case 'uiSref':
			return `[routerLink]="['${attribute.value.replace('.', '/')}']"`;
		case 'uiParams':
			return `[queryParams]="${attribute.value}"`;
		case 'ui-view':
			return attribute.value ? `[name]="${attribute.value}"` : '';
		case 'uiSrefActive':
			return attribute.value === '/' ? `routerLinkActive="${attribute.value}" [routerLinkActiveOptions]="{exact: true}"` : `routerLinkActive="${attribute.value}"`;
		default:
			return text;
	}
}

function handleElement(element: Element, text: string): string {
	if (element.name === 'ui-router') {
		return text.replace('ui-router', 'router-outlet');
	}
	return text;
}

function replaceParentElement(parent: Element, parentText: string, additionalReplacement: string = ''): string {
	// The logic to replace the parent <ui-view> with <router-outlet>, including any additionalReplacement
	const openingTagReplacement = `<router-outlet ${additionalReplacement}>`;
	const closingTagReplacement = `</router-outlet>`;
	const openingTagRegex = new RegExp(`<${parent.name}[^>]*>`, 'g');
	const closingTagRegex = new RegExp(`</${parent.name}>`, 'g');

	parentText = parentText.replace(openingTagRegex, openingTagReplacement);
	parentText = parentText.replace(closingTagRegex, closingTagReplacement);
	return parentText;
}