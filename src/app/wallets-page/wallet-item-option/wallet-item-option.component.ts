import { Component, DestroyRef, inject, input, output, OutputEmitterRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiButton, TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { DialogService } from 'shared/dialog.service';
import { WalletDto } from 'wallets-page/wallets.service';

@Component({
	selector: 'app-wallet-item-option',
	imports: [TuiDropdown, TuiDataList, TuiIcon, TuiButton],
	templateUrl: './wallet-item-option.component.html',
	styleUrl: './wallet-item-option.component.css',
})
export class WalletItemOptionComponent {
	private dialogService = inject(DialogService);
	private destroyRef = inject(DestroyRef);

	wallet = input.required<WalletDto>();
	moreIconSize = input<'m' | 'l' | 'xl' | 's' | 'xs'>('m');

	block = output();
	unblock = output();
	deactivate = output();

	protected open = false;

	deactivateWallet() {
		this.doAction(this.deactivate, 'deactivate');
	}

	unblockWallet() {
		this.doAction(this.unblock, 'unblock');
	}

	blockWallet() {
		this.doAction(this.block, 'block');
	}

	private doAction(emitter: OutputEmitterRef<void>, actionText: 'block' | 'deactivate' | 'unblock'): void {
		this.dialogService
			.confirm({
				text: `Are you sure you want to ${actionText} this wallet?`,
			})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((confirm) => {
				if (confirm) {
					emitter.emit();
					this.open = false;
				}
			});
	}
}
