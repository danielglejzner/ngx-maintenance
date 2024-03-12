export interface RegistryInfo {
	db_name: string;
	doc_count: number;
	doc_del_count: number;
	update_seq: number;
	purge_seq: number;
	compact_running: boolean;
	disk_size: number;
	data_size: number;
	instance_start_time: string;
	disk_format_version: number;
	committed_update_seq: number;
}
