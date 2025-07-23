import QRCode from 'qrcode';
import { AsyncPipe, Location } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiIcon } from '@taiga-ui/core';
import { finalize, of, type Observable } from 'rxjs';
import { tuiPure } from '@taiga-ui/cdk';
import { WalletItemOptionComponent } from '../wallet-item-option/wallet-item-option.component';
import { TransactionsPageComponent } from '../../transactions-page/transactions-page.component';
import { WalletStatusChipComponent } from 'wallets-page/wallet-status-chip/wallet-status-chip.component';
import { CopyIconComponent } from 'ui/copy-icon/copy-icon.component';
import { WalletDto, WalletsService } from 'wallets-page/wallets.service';
import { CurrenciesService } from 'shared/currencies.service';
import { DialogService } from 'shared/dialog.service';

@Component({
	selector: 'app-wallet-info',
	imports: [
		TuiIcon,
		AsyncPipe,
		WalletStatusChipComponent,
		WalletItemOptionComponent,
		TransactionsPageComponent,
		CopyIconComponent,
	],
	templateUrl: './wallet-info.component.html',
	styleUrl: './wallet-info.component.css',
})
export class WalletInfoComponent {
	public address = input<string>();

	private walletsService = inject(WalletsService);
	private destroyRef = inject(DestroyRef);
	private location = inject(Location);
	private cryptoService = inject(CurrenciesService);
	private dialogService = inject(DialogService);

	protected isLoading = signal(false);
	protected error = signal<unknown | null>(null);

	protected walletInfo = signal<WalletDto | null>(null);
	protected addressDataUrl = signal<string | null>(null);

	constructor() {
		effect(() => {
			const address = this.address();
			if (address) {
				this.generateQR();

				this.updateWalletInfo(address);
			}
		});
	}

	back() {
		this.location.back();
	}

	@tuiPure
	getCryptoIconUrl(): Observable<string> {
		const info = this.walletInfo();
		if (!info) {
			return of('');
		}

		return this.cryptoService.getCurrencyLinkUrl(info.cryptocurrency);
	}

	@tuiPure
	getCryptoName(): Observable<string> {
		const info = this.walletInfo();
		if (!info) {
			return of('');
		}

		return this.cryptoService.getCurrencyName(info.cryptocurrency);
	}

	onBlock(): void {
		const wallet = this.walletInfo();
		const address = this.address();
		if (!wallet || !address) {
			return;
		}

		this.walletsService
			.blockWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => this.updateWalletInfo(address),
				error: (err) => {
					console.error(err);
					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});
	}

	onUnblock(): void {
		const wallet = this.walletInfo();
		const address = this.address();
		if (!wallet || !address) {
			return;
		}

		this.walletsService
			.unblockWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => this.updateWalletInfo(address),
				error: (err) => {
					console.error(err);
					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});
	}

	onDeactivate(): void {
		const wallet = this.walletInfo();
		const address = this.address();
		if (!wallet || !address) {
			return;
		}

		this.walletsService
			.deactivateWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => this.updateWalletInfo(address),
				error: (err) => {
					console.error(err);
					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});
	}

	private async generateQR() {
		const address = this.address();
		if (address) {
			this.addressDataUrl.set(await QRCode.toDataURL(address, { margin: 0, width: 84 }));
		}
	}

	private updateWalletInfo(address: string) {
		this.error.set(null);
		this.isLoading.set(true);
		this.walletsService
			.getWalletInfo(address)
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: (walletInfo) => {
					this.walletInfo.set(walletInfo);
				},
				error: (err) => {
					this.error.set(err);
					this.dialogService
						.showInfo({
							type: 'warning',
							title: 'Error',
							text: 'An unexpected error has appeared. Please try again later.',
						})
						.subscribe();
				},
			});
	}
}
