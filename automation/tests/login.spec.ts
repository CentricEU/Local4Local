import {test, expect} from "@playwright/test";
import {LoginPage} from "../src/pages/loginPage";
import {DataBase} from "../src/db/dbConnection";

const db = new DataBase();

test.beforeEach(async ({page}) => {
    await page.goto('/login');
    await expect(page.locator('.bold')).toContainText('...Log in');
});

test('User with correct credentials can get the MFA page', async ({page}) => {
    console.log(process.env.APP_EMAIL, process.env.APP_PASSWORD)
    await LoginPage.loginIntoApp(page, process.env.APP_EMAIL, process.env.APP_PASSWORD);

    await expect(page).toHaveURL(/mfa/);
})

test('User can log in with correct credentials', async ({page}) => {
    console.log(process.env.APP_EMAIL, process.env.APP_PASSWORD)
    await LoginPage.loginIntoAppWithMfa(page, process.env.APP_EMAIL, process.env.APP_PASSWORD);

    await expect(page).toHaveURL(/dashboard/);

    await LoginPage.logoutFomApp(page);
    await expect(page.locator('.bold')).toContainText('...Log in');
})