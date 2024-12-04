import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormUtil } from './form.util';
import { RegexUtil } from './regex.util';

describe('FormUtil', () => {
    let formBuilder: FormBuilder;
    let form: FormGroup;
    let confirmPasswordControl: AbstractControl;

    beforeEach(() => {
        formBuilder = new FormBuilder();
        form = formBuilder.group({
            companyName: new FormControl('', Validators.required),
            identifierNumber: new FormControl('', [Validators.required]),
            website: new FormControl('', Validators.pattern(RegexUtil.urlRegexPattern))
        });
    });

    describe('hasRequiredError', () => {
        test.each([
            ['companyName', '', true],
            ['companyName', 'Some Company', false],
            ['identifierNumber', '', true],
            ['identifierNumber', '12345678', false],
            ['nonExistentField', '', false],
        ])('should return %p for field %s with value %p', (fieldName, value, expectedError) => {
            if (form.get(fieldName)) {
                form.get(fieldName)?.setValue(value);
                form.get(fieldName)?.markAsTouched();
            }
            expect(FormUtil.hasRequiredError(form, fieldName)).toBe(expectedError);
        });
    });

    describe('hasPatternError', () => {
        test.each([
            ['identifierNumber', '1234', false],
            ['identifierNumber', '12345678', false],
            ['identifierNumber', 'abcd1234', false],
            ['nonExistentField', '', false],
        ])('should return %p for field %s with value %p', (fieldName, value, expectedError) => {
            if (form.get(fieldName)) {
                form.get(fieldName)?.setValue(value);
                form.get(fieldName)?.markAsTouched();
            }
            expect(FormUtil.hasPatternError(form, fieldName)).toBe(expectedError);
        });
    });

    describe('ConfirmPasswordValidator', () => {
        beforeEach(() => {
            form = new FormGroup({
                password: new FormControl('password', [Validators.required]),
                confirmPassword: new FormControl('password', [Validators.required, FormUtil.confirmPasswordValidator]),
            })
        });

        it('should return null if passwords match', () => {
            confirmPasswordControl = form.get('confirmPassword') as FormControl;
            const result = FormUtil.confirmPasswordValidator(confirmPasswordControl);
            expect(result).toBeNull();
        });

        it('should return fieldsMismatch error if passwords do not match', () => {
            form = new FormGroup({
                password: new FormControl('password123', [Validators.required]),
                confirmPassword: new FormControl('password', [Validators.required, FormUtil.confirmPasswordValidator]),
            })
            confirmPasswordControl = form.get('confirmPassword') as FormControl;
            const result = FormUtil.confirmPasswordValidator(confirmPasswordControl);
            expect(result).toEqual({ fieldsMismatch: true });
        });
    });

    describe('validatePassword', () => {
        it('should return null for a valid password', () => {
            const control = new FormControl('ValidPassword123.');
            const result = FormUtil.validatePassword(control);
            expect(result).toBeNull();
        });

        it('should return validPassword error for an invalid password', () => {
            const control = new FormControl('1234');
            const result = FormUtil.validatePassword(control);
            expect(result).toEqual({ validPassword: true });
        });
    });

});
