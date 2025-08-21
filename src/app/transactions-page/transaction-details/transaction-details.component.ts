import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { injectContext } from '@taiga-ui/polymorpheus';
import { type TuiDialogContext, TuiIcon } from '@taiga-ui/core';
import { DatePipe } from '@angular/common';
import { domToPng } from 'modern-screenshot';
import { TuiAlertService } from '@taiga-ui/core';
import { TransactionStatusChipComponent } from 'transactions-page/transaction-status-chip/transaction-status-chip.component';
import { CopyIconComponent } from 'ui/copy-icon/copy-icon.component';
import { CurrenciesService } from 'shared/currencies.service';
import { TransactionDto } from 'transactions-page/transactions.service';

@Component({
	selector: 'app-transaction-details',
	imports: [TransactionStatusChipComponent, CopyIconComponent, DatePipe, TuiIcon],
	templateUrl: './transaction-details.component.html',
	styleUrl: './transaction-details.component.scss',
})
export class TransactionDetailsComponent {
	private destroyRef = inject(DestroyRef);
	private cryptocurrenciesService = inject(CurrenciesService);
	private readonly alerts = inject(TuiAlertService);
	public readonly context = injectContext<TuiDialogContext<void, TransactionDto>>();

	transaction = signal<TransactionDto>({} as unknown as TransactionDto);
	scanUrl = signal('');
	scanWalletUrl = signal('');
	fromScanUrl = signal('');
	fromScanWalletUrl = signal('');
	toScanUrl = signal('');
	toScanWalletUrl = signal('');

	toTrxAddressUrl = computed(() =>
		this.toScanWalletUrl() ? this.toScanWalletUrl().replace('{address}', this.transaction().toTrxAddress) : '#',
	);
	fromTrxAddressUrl = computed(() =>
		this.fromScanWalletUrl() ? this.fromScanWalletUrl().replace('{address}', this.transaction().fromTrxAddress) : '#',
	);
	transactionHashAddress = computed(() =>
		this.scanUrl() ? this.scanUrl().replace('{hash}', this.transaction().transactionHash) : '#',
	);

	isOutTransaction = computed(() => ['CSTD_OUT', 'C2F', 'OUT'].includes(this.transaction().type));
	displayToWallet = computed(() => ['CSTD_OUT', 'CSTD_IN'].includes(this.transaction().type));

	currencyFrom = computed(() =>
		this.isOutTransaction() ? this.transaction().currencyFrom : this.transaction().currencyTo,
	);

	ngOnInit() {
		this.transaction.set(this.context.data);

		if (this.transaction().cryptocurrency) {
			this.cryptocurrenciesService
				.getCryptoInfo(this.transaction().cryptocurrency)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((info) => {
					this.scanUrl.set(info?.scanUrl ?? '');
					this.scanWalletUrl.set(info?.scanWalletUrl ?? '');
				});
		}

		if (this.currencyFrom()) {
			this.cryptocurrenciesService
				.getCryptoInfo(this.currencyFrom())
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((info) => {
					this.fromScanUrl.set(info?.scanUrl ?? '');
					this.fromScanWalletUrl.set(info?.scanWalletUrl ?? '');
				});
		}

		if (this.transaction().currencyTo) {
			this.cryptocurrenciesService
				.getCryptoInfo(this.transaction().currencyTo)
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((info) => {
					this.toScanUrl.set(info?.scanUrl ?? '');
					this.toScanWalletUrl.set(info?.scanWalletUrl ?? '');
				});
		}
	}

	async download() {
		const el = document.querySelector<HTMLElement>('.screenshot-wrapper');
		if (!el) return;

		domToPng(el, {
			filter: (elem) => elem.nodeName !== 'APP-COPY-ICON',
			style: { padding: '20px' },
			width: 580,
			onCloneEachNode(cloned) {
				const copy = cloned as HTMLDivElement;
				if (copy.classList.contains('address')) {
					copy.style.textOverflow = 'unset';
					copy.style.height = 'auto';
					copy.style.wordBreak = 'break-all';
					copy.style.marginLeft = '8px';
				}
			},
		}).then((dataUrl) => {
			const link = document.createElement('a');
			link.download = 'transaction.png';
			link.href = dataUrl;
			link.click();
			this.alerts.open('Download started! Check your Files or Downloads folder.', { label: 'Info' }).subscribe();
		});
	}
}
