import { Component, computed, DestroyRef, inject, Injector, input, OnInit, signal, viewChild } from '@angular/core';
import { TuiButton, TuiDialogService, TuiIcon, TuiTextfield } from '@taiga-ui/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Paginator, PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { TuiTable } from '@taiga-ui/addon-table';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { tuiPure } from '@taiga-ui/cdk';
import { debounceTime, filter, finalize, type Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
	type TransactionFilterModel,
	TransactionsFilterModalComponent,
} from './transactions-filter-modal/transactions-filter-modal.component';
import { PolymorpheusComponent } from '@taiga-ui/polymorpheus';
import { format } from 'date-fns';
import { TransactionDetailsComponent } from './transaction-details/transaction-details.component';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { isTransactionIn } from './utils';
import { TransactionStatusChipComponent } from './transaction-status-chip/transaction-status-chip.component';
import { TransactionTypeIconComponent } from './transaction-type-icon/transaction-type-icon.component';
import { CopyIconComponent } from 'ui/copy-icon/copy-icon.component';
import { LoaderComponent } from 'ui/loader/loader.component';
import { EmptyDisplayComponent } from 'ui/empty-display/empty-display.component';
import { ErrorDisplayComponent } from 'ui/error-display/error-display.component';
import { CurrenciesService } from 'shared/currencies.service';
import { TransactionDto, TransactionPageableParams, TransactionsService } from './transactions.service';

@Component({
	selector: 'app-transactions-page',
	imports: [
		TuiTextfield,
		FormsModule,
		TuiButton,
		TuiIcon,
		TransactionStatusChipComponent,
		TransactionTypeIconComponent,
		PaginatorModule,
		CopyIconComponent,
		TuiTable,
		DatePipe,
		DecimalPipe,
		AsyncPipe,
		ReactiveFormsModule,
		TransactionTypeIconComponent,
		ScrollingModule,
		LoaderComponent,
		EmptyDisplayComponent,
		ErrorDisplayComponent,
	],
	templateUrl: './transactions-page.component.html',
	styleUrl: './transactions-page.component.css',
})
export class TransactionsPageComponent implements OnInit {
	private cryptocurrenciesService = inject(CurrenciesService);
	private transactionService = inject(TransactionsService);
	private destroyRef = inject(DestroyRef);
	private dialogService = inject(TuiDialogService);
	private injector = inject(Injector);

	paginator = viewChild(Paginator);

	trxWalletAddress = input<string>();

	public viewport = viewChild(CdkVirtualScrollViewport);

	protected isLoading = signal(false);
	isMobileLoading = signal(false);
	protected hasError = signal(false);
	displayError = computed(() => !this.isLoading() && this.hasError());
	displayEmpty = computed(() => !this.isLoading() && !this.transactions()?.length && !this.hasError());

	protected page = signal(0);
	protected readonly pageSize = 10;
	private filters?: TransactionFilterModel;

	protected columns = ['createdAt', 'transactionHash', 'address', 'amount', 'status', 'type'];
	protected transactions = signal<TransactionDto[]>([]);
	protected search = new FormControl<string | null>(null, [
		Validators.minLength(64),
		Validators.pattern(/^[a-fA-F0-9x]+$/),
	]);
	protected totalElements = signal(0);

	constructor() {
		this.search.valueChanges
			.pipe(
				filter(() => this.search.valid),
				debounceTime(300),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe(() => {
				this.loadTransactions();
			});
	}

	ngOnInit() {
		this.loadTransactions();
	}

	@tuiPure
	getAddress(transaction: TransactionDto) {
		if (isTransactionIn(transaction.type)) {
			return transaction.toTrxAddress;
		}

		return transaction.fromTrxAddress;
	}

	@tuiPure
	getAmountPrefix(transaction: TransactionDto): '+' | '-' {
		if (isTransactionIn(transaction.type)) {
			return '+';
		}

		return '-';
	}

	@tuiPure
	getAmount(transaction: TransactionDto): string {
		if (isTransactionIn(transaction.type)) {
			return transaction.amount;
		}

		return transaction.amountInSenderCurrency;
	}

	@tuiPure
	getCryptoIcon(transaction: TransactionDto): Observable<string> {
		// return this.cryptocurrenciesService.getCurrencyLinkUrl(transaction.cryptocurrency);
		if (isTransactionIn(transaction.type)) {
			return this.cryptocurrenciesService.getCurrencyLinkUrl(transaction.currencyTo);
		}

		return this.cryptocurrenciesService.getCurrencyLinkUrl(transaction.currencyFrom);
	}

	trackById(i: number): number {
		return i;
	}

	hasFilters(): boolean {
		return !!this.filters && Object.keys(this.filters).length > 0;
	}
	onPageChange(state: PaginatorState): void {
		if (state.page != null && state.page !== this.page()) {
			this.page.set(state.page);
			this.loadTransactions();
		}
	}

	openFilters() {
		this.dialogService
			.open<TransactionFilterModel>(new PolymorpheusComponent(TransactionsFilterModalComponent, this.injector), {
				data: this.filters,
			})
			.pipe(filter((val) => !!val))
			.subscribe((filters) => {
				this.filters = filters;
				this.resetTransactions();
			});
	}

	openDetails(transaction: TransactionDto) {
		this.dialogService
			.open(new PolymorpheusComponent(TransactionDetailsComponent, this.injector), {
				data: transaction,
			})
			.subscribe();
	}

	private resetTransactions() {
		this.page.set(0);
		this.loadTransactions();
	}

	private loadTransactions() {
		this.isLoading.set(true);
		this.hasError.set(false);
		this.getTransactions()
			.pipe(
				finalize(() => this.isLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: (res) => {
					this.transactions.set(res.data);
					this.totalElements.set(res.total);
				},
				error: (err) => {
					this.hasError.set(true);
					console.error(err);
					this.transactions.set([]);
				},
			});
	}

	private getTransactions() {
		const params: TransactionPageableParams = {
			size: this.pageSize,
			sort: 'id,desc',
			page: this.page(),
		};
		if (this.search.value) {
			params.transactionHash = this.search.value;
		}
		if (this.filters?.dateFrom) params.dateFrom = this.formatDate(this.filters.dateFrom.toLocalNativeDate());
		if (this.filters?.dateTo) params.dateTo = this.formatDate(this.filters.dateTo.toLocalNativeDate());
		if (this.filters?.cryptocurrency) params.cryptocurrency = this.filters.cryptocurrency.cryptoCurrency;
		if (this.filters?.statuses) params.statuses = this.filters.statuses;
		if (this.trxWalletAddress()) params.trxAddress = this.trxWalletAddress();

		return this.transactionService.getTransactions(params);
	}

	private formatDate(date: Date): string {
		return format(date, 'yyyy-MM-dd HH:mm');
	}
}
