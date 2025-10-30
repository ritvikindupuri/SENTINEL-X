from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")
    page.wait_for_load_state("networkidle")
    element = page.locator('div.col-span-4.row-span-8')
    element.screenshot(path="jules-scratch/verification/rso_characterization.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
