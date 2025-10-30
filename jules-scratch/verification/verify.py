from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Click the settings icon
    page.click('button[aria-label="Settings"]')

    # Wait for the username input to be visible and fill credentials
    username_input = page.locator('input[placeholder="Username"]')
    expect(username_input).to_be_visible()
    username_input.fill("user")
    page.locator('input[placeholder="Password"]').fill("password")

    # Click save
    page.locator('button:has-text("Save")').click()

    # Wait for satellite markers to appear
    satellite_marker = page.locator("img.leaflet-marker-icon").first
    expect(satellite_marker).to_be_visible(timeout=30000)

    # Click the first satellite
    satellite_marker.click()

    # Wait for the dialog to appear
    detail_view = page.locator('div[role="dialog"]')
    expect(detail_view).to_be_visible()

    # Take a screenshot of the detail view
    detail_view.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
