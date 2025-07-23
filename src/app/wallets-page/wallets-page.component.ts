import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, type OnInit, computed, inject, model, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TuiTable } from '@taiga-ui/addon-table';
import { tuiPure } from '@taiga-ui/cdk';
import { TuiDataList, TuiDropdown, TuiIcon } from '@taiga-ui/core';
import { TuiFilterByInputPipe } from '@taiga-ui/kit';
import { TuiComboBoxModule, TuiSelectModule, TuiTextfieldControllerModule } from '@taiga-ui/legacy';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { type Observable, finalize } from 'rxjs';
import { WalletItemOptionComponent } from './wallet-item-option/wallet-item-option.component';
import { explicitEffect } from 'ngxtension/explicit-effect';
import { WalletStatusChipComponent } from './wallet-status-chip/wallet-status-chip.component';
import { CopyIconComponent } from 'ui/copy-icon/copy-icon.component';
import { LoaderComponent } from 'ui/loader/loader.component';
import { EmptyDisplayComponent } from 'ui/empty-display/empty-display.component';
import { ErrorDisplayComponent } from 'ui/error-display/error-display.component';
import { CurrenciesService, CurrencyDto } from 'shared/currencies.service';
import { GetWalletsParams, WalletDto, WalletsService } from './wallets.service';
import { DialogService } from 'shared/dialog.service';

@Component({
	selector: 'app-wallets-page',
	imports: [
		TuiComboBoxModule,
		TuiSelectModule,
		TuiIcon,
		FormsModule,
		TuiTable,
		TuiTextfieldControllerModule,
		TuiDropdown,
		TuiDataList,
		WalletStatusChipComponent,
		AsyncPipe,
		WalletItemOptionComponent,
		PaginatorModule,
		TuiFilterByInputPipe,
		RouterModule,
		ScrollingModule,
		CopyIconComponent,
		LoaderComponent,
		EmptyDisplayComponent,
		ErrorDisplayComponent,
	],
	templateUrl: './wallets-page.component.html',
	styleUrl: './wallets-page.component.css',
})
export class WalletsPageComponent implements OnInit {
	private cryptocurrenciesService = inject(CurrenciesService);
	private walletsService = inject(WalletsService);
	private destroyRef = inject(DestroyRef);
	private router = inject(Router);
	private dialogService = inject(DialogService);

	public viewport = viewChild(CdkVirtualScrollViewport);
	viewportScrolled = computed(() => this.viewport()?.elementScrolled?.());

	protected cryptocurrencies = signal<CurrencyDto[]>([]);
	protected selectedCurrency = model<CurrencyDto | null>(null);
	protected isLoading = signal(false);
	protected page = signal(0);
	protected pageSize = 10;
	protected totalElements = signal(0);

	protected wallets = signal<WalletDto[]>([]);
	protected columns = ['trxAddress', 'availableOprBalance', 'walletStatus', 'actions'];
	protected open = false;

	error = signal<unknown>(null);

	isEmpty = computed(() => !this.isLoading() && !this.wallets()?.length && !this.hasError());
	hasError = computed(() => !this.isLoading() && !!this.error());

	constructor() {
		explicitEffect([this.selectedCurrency], ([currency]) => {
			this.page.set(0);
			this.loadWallets(currency?.cryptoCurrency);
		});
	}

	ngOnInit() {
		this.loadCurrencies();
	}

	openDetails(wallet: WalletDto): void {
		this.router.navigate(['wallets', wallet.trxAddress]);
	}

	navigateDetails(wallet: WalletDto): void {
		this.router.navigateByUrl(`/wallets/${wallet.trxAddress}`);
	}

	@tuiPure
	getCryptoIcon(crypto: string): Observable<string> {
		return this.cryptocurrenciesService.getCurrencyLinkUrl(crypto);
	}

	onPageChange(state: PaginatorState) {
		if (state.page != null) {
			this.page.set(state.page);
			this.loadWallets();
		}
	}

	onBlock(wallet: WalletDto): void {
		this.walletsService
			.blockWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => (wallet.walletStatus = 'CUSTOMER_BLOCKED'),
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

	onUnblock(wallet: WalletDto): void {
		this.walletsService
			.unblockWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => (wallet.walletStatus = 'ACTIVE'),
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

	onDeactivate(wallet: WalletDto): void {
		this.walletsService
			.deactivateWallet(wallet)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: () => (wallet.walletStatus = 'DEACTIVATED'),
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

	stringifyCryptoSelectItem(item: CurrencyDto): string {
		return item.cryptoCurrencyName;
	}

	currencyMatcher(item: CurrencyDto, search: string): boolean {
		return (
			item.cryptoCurrency.toLowerCase().includes(search.toLowerCase()) ||
			item.cryptoCurrencyName.toLowerCase().includes(search.toLowerCase())
		);
	}

	private loadWallets(selectedCurrency?: string) {
		this.error.set(null);
		this.isLoading.set(true);
		const params: GetWalletsParams = {
			statusIn: ['ACTIVE', 'CUSTOMER_BLOCKED', 'DEACTIVATED'],
			page: this.page(),
			size: this.pageSize,
			sort: 'id,desc',
		};
		if (selectedCurrency) {
			params.cryptocurrency = selectedCurrency;
		}

		this.walletsService
			.getWallets(params)
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: (walletsResponse) => {
					this.wallets.set(walletsResponse.data);
					this.totalElements.set(walletsResponse.totalElements);
				},
				error: (err) => {
					console.error(err);
					this.error.set(err);
				},
			});
	}

	private loadCurrencies() {
		this.cryptocurrenciesService.getCurrenciesRequest
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe((currencies) => this.cryptocurrencies.set(currencies));
	}
}
