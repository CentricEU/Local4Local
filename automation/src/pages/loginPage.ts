import {defineConfig, expect, Page} from "@playwright/test";
import {DataBase} from "../db/dbConnection";

const db = new DataBase();

export class LoginPage {
    private static locators = {
        email: '[formcontrolname="email"]',
        pass: '[formcontrolname="password"]',
        rememberMe: '#mat-mdc-checkbox-1-input',
        loginBtn: '.mat-mdc-button-touch-target',
        logoutBtn: '.logout-button',
        mfaInput: '[formcontrolname="code"]',
        mfaContinueBtn: '.mat-mdc-button-persistent-ripple'
    };

    static async loginIntoApp(page: Page, email: string, password: string): Promise<void> {
        try {
            // Check if the Login button is disabled
            const loginButton = page.locator(this.locators.loginBtn);
            await expect(loginButton).toBeDisabled();

            // Enter the email and password
            await page.click(this.locators.email);
            await page.type(this.locators.email, email);

            await page.click(this.locators.pass);
            await page.fill(this.locators.pass, password);

            // Toggle the rememberMe checkbox
            const rememberMeCheckbox = page.locator(this.locators.rememberMe);
            await expect(rememberMeCheckbox).not.toBeChecked();
            await rememberMeCheckbox.check();

            // Click the login button
            await page.click(this.locators.loginBtn);

            const continueButton = page.locator(this.locators.loginBtn);
            await expect(continueButton).toBeDisabled();

        } catch (error) {
            console.error('An error occurred during login:', error);
            throw error; // Rethrow the error to indicate test failure
        }
    }

    static async loginIntoAppWithMfa(page: Page, email: string, password: string): Promise<void> {
        await this.loginIntoApp(page, email, password);
        await expect(page).toHaveURL(/mfa/);

        await page.waitForTimeout(1000)
        const mfaCodeResult = await db.getValueOfExecuteQueryFromFile('../../src/db/mfaCode.sql', [process.env.APP_EMAIL]);
        if (mfaCodeResult && mfaCodeResult.length > 0) {
            const latestMfaCode = mfaCodeResult[0].otp_code.toString();
            await page.type(this.locators.mfaInput, latestMfaCode);
            const continueButton = page.locator(this.locators.loginBtn);
            await expect(continueButton).toBeEnabled();
            await page.click(this.locators.mfaContinueBtn);
        }
    }

    static async logoutFomApp(page): Promise<void> {
        const logoutButton = page.locator(this.locators.logoutBtn)
        if (await logoutButton.isVisible()) {
            await logoutButton.click();
        }
    }
}

