import { inject, Injectable } from '@angular/core';
import { tuiDialog, TuiDialogService } from '@taiga-ui/core';
import { ConfirmModalComponent, type ConfirmModalInfo } from 'ui/modals/confirm-modal/confirm-modal.component';
import { InfoModalComponent, type InfoModalConfig } from 'ui/modals/info-modal/info-modal.component';
import type { Observable } from 'rxjs';

export interface DialogMessageModel {
	title: string;
	message: string;
	buttonText?: string;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
	private readonly dialogs = inject(TuiDialogService);
	private confirmDialog = tuiDialog(ConfirmModalComponent, { size: 'auto' });
	private infoDialog = tuiDialog(InfoModalComponent, {
		size: 'auto',
		closeable: false,
	});

	showMessage(message: string, title: string, buttonText = 'Ok'): void {
		this.dialogs
			.open(message, {
				label: title,
				size: 's',
				data: { button: buttonText },
			})
			.subscribe();
	}

	showInfo(info: InfoModalConfig): Observable<void> {
		return this.infoDialog(info);
	}

	confirm(info: ConfirmModalInfo): Observable<boolean> {
		return this.confirmDialog(info);
	}
}
