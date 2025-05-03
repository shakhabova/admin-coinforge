import {
  Component,
  type OnInit,
  computed,
  inject,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TuiLabel } from '@taiga-ui/core';
import { TuiCheckbox } from '@taiga-ui/kit';

@Component({
  selector: 'app-mfa-connect',
  imports: [FormsModule, TuiLabel, TuiCheckbox],
  templateUrl: './mfa-connect.component.html',
  styleUrl: './mfa-connect.component.less',
})
export class MfaConnectComponent implements OnInit {
  private router = inject(Router);

  protected mfaAdded = model(false);
  protected isMobileAppsPage = signal(true);
  protected displayBack = computed(() => !this.isMobileAppsPage());
  protected displayNext = computed(() => this.isMobileAppsPage());

  mfaQR = this.router.getCurrentNavigation()?.extras.state?.['mfaQR'];

  ngOnInit(): void {
    if (!this.mfaQR) {
      this.goToLogin();
    }
  }

  goNext() {
    this.isMobileAppsPage.set(false);
  }

  goBack() {
    this.isMobileAppsPage.set(true);
  }

  done() {
    this.goToLogin();
  }

  private goToLogin() {
    this.router.navigateByUrl('/login');
  }
}
