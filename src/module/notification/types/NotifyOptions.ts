export interface NotifyOptions {
	title?: string;
	message: string;
	link?: string;
	/** Show the toast only, without recording it in the notification list. */
	toastOnly?: boolean;
	autoClose?: number | false;
}
