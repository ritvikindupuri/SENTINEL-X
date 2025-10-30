from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.wait_for_selector("main", state="attached")
    page.click("button[aria-label='Settings']")
    page.screenshot(path="jules-scratch/verification/settings_modal.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
