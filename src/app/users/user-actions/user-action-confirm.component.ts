import { Component } from '@angular/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { injectContext } from '@taiga-ui/polymorpheus';

export type UserActionConfirmType =
  | 'block'
  | 'unblock'
  | 'reject'
  | 'deactivate'
  | 'activate';

@Component({
  selector: 'app-user-action-confirm',
  imports: [],
  template: `
    <div class="h4-heading tui-space_bottom-10" style="text-align: center">
      Are you sure you want to {{ context.data }} this user?
    </div>
    <div class="u-row-middle">
      <button class="button secondary m" (click)="context.completeWith(false)">
        No
      </button>
      <button
        class="button primary m tui-space_left-6"
        [class.mod-error]="isError"
        (click)="context.completeWith(true)"
      >
        Yes
      </button>
    </div>
  `,
  styles: `
    .button.primary.mod-error,
    .button.primary.mod-error:hover {
      border: 1px solid rgb(212, 58, 49);
      background-color: var(--system-color-red);
      color: white;
    }

    .button {
      flex: 1 0 0;
    }
  `,
})
export class UserActionConfirmComponent {
  public context =
    injectContext<TuiDialogContext<boolean, UserActionConfirmType>>();

  get isError() {
    return ['block', 'reject', 'deactivate'].includes(this.context.data);
  }
}
