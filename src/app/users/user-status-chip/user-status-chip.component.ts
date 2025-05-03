import { Component, computed, input } from '@angular/core';
import { UserInfoDto, UserStatus } from 'shared/user.service';

const USER_STATUSES_LABELS: Record<UserStatus, string> = {
  EMAIL_NOT_CONFIRMED: 'EMAIL NOT CONFIRMED',
  PENDING: 'Pending',
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
  REJECTED: 'Rejected',
};

@Component({
  selector: 'app-user-status-chip',
  imports: [],
  templateUrl: './user-status-chip.component.html',
  styleUrl: './user-status-chip.component.scss',
})
export class UserStatusChipComponent {
  status = input.required<UserStatus>();
  statusLabel = computed(
    () => USER_STATUSES_LABELS[this.status()] ?? this.status(),
  );
}
