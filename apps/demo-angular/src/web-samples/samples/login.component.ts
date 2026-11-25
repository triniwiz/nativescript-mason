import { Component, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NativeScriptFormsModule } from '@nativescript/angular';
import { DemoPageComponent } from '../../shared/demo-page.component';

@Component({ selector: 'demo-login', templateUrl: 'login.component.html', styleUrl: 'login.component.scss', imports: [DemoPageComponent, NativeScriptFormsModule, ReactiveFormsModule], schemas: [NO_ERRORS_SCHEMA] })
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: true,
  });
  readonly error = signal('');
  readonly notice = signal('');

  signIn(): void {
    const { email, password } = this.form.controls;
    this.error.set(email.invalid ? 'Please enter a valid email address.' : password.invalid ? 'Password must be at least 6 characters.' : '');
    this.notice.set(this.form.valid ? `Signed in as ${email.value} (demo).` : '');
  }
}
