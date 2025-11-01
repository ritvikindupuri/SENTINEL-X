
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # --- Event Listeners ---
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

        def handle_websocket_frame(frame):
            print(f"WS RECV: {frame.payload_text()}")

        page.on("websocket", lambda ws: ws.on("framereceived", handle_websocket_frame))

        # --- Verification Logic ---
        try:
            print("Navigating to the page...")
            await page.goto("http://localhost:3001", wait_until="networkidle")

            print("\nPage loaded. Monitoring network traffic for 10 seconds...")
            await asyncio.sleep(10)

            # Although we aren't testing the UI, a final screenshot is good for context.
            final_screenshot_path = "/home/swebot/jules-scratch/verification/data_flow_verification.png"
            await page.screenshot(path=final_screenshot_path)
            print(f"\nFinal screenshot saved to {final_screenshot_path}")

            print("\nVerification complete. Please check the console logs and WS traffic above.")
            print("Look for 'Connecting to backend...' and 'New dashboard data...' console messages,")
            print("and WebSocket frames containing 'dashboard_data' and 'new_anomaly' events.")

        except Exception as e:
            print(f"An error occurred during verification: {e}")
            await page.screenshot(path="/home/swebot/jules-scratch/verification/e2e_error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
