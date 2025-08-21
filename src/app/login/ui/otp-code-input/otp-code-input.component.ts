import { Component, model, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputOTPComponent } from '@ngxpert/input-otp';
import { cn } from 'utils/styles';
import { TuiAutoFocus } from "@taiga-ui/cdk";

@Component({
	selector: 'app-otp-code-input',
	imports: [FormsModule, InputOTPComponent, TuiAutoFocus],
	templateUrl: './otp-code-input.component.html',
	styleUrl: './otp-code-input.component.css',
})
export class OtpCodeInputComponent {
	otpCode = model('');
	length = input(6);
	error = input(false);
	disabled = input(false);
	submit = output();

	cn = cn;
}
