import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { WalletItemOptionComponent } from '../wallet-item-option/wallet-item-option.component';
import { WalletStatusChipComponent } from 'wallets-page/wallet-status-chip/wallet-status-chip.component';
import { CopyIconComponent } from 'ui/copy-icon/copy-icon.component';
import { WalletDto } from 'wallets-page/wallets.service';
import { CurrenciesService } from 'shared/currencies.service';

@Component({
	selector: 'app-wallet-info-card',
	imports: [DecimalPipe, AsyncPipe, WalletStatusChipComponent, CopyIconComponent, WalletItemOptionComponent],
	templateUrl: './wallet-info-card.component.html',
	styleUrl: './wallet-info-card.component.css',
})
export class WalletInfoCardComponent {
	wallet = input.required<WalletDto>();

	block = output();
	unblock = output();
	deactivate = output();

	private cryptoService = inject(CurrenciesService);

	cryptoIcon = computed(() => this.cryptoService.getCurrencyLinkUrl(this.wallet().cryptocurrency));
	cryptoName = computed(() => this.cryptoService.getCurrencyName(this.wallet().cryptocurrency));

	onDeactivate() {
		this.deactivate.emit();
	}

	onUnblock() {
		this.unblock.emit();
	}

	onBlock() {
		this.block.emit();
	}
}
