# utils

Helper functions for node http and our try catch function

```
export async function tryCatch<T, E extends Error>(
	mainOperation: () => Promise<T> | T
): Promise<{ error?: E; result?: T }> {
	try {
		const result = await Promise.resolve(mainOperation());
		return { result };
	} catch (error) {
		if (error instanceof Error) {
			return { error: error as E };
		}
		console.error("Caught an unexpected error type:", error);
		return { error: new Error("An unexpected error occurred") as E };
	}
}
```