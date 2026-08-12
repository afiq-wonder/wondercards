# RevenueCat setup — WonderCards

WonderCards uses the RevenueCat Capacitor SDK and native RevenueCat Paywalls.

## App identifiers

- Android package: `com.wonderlabs.wondercards`
- Entitlement: `wondercards_plus`
- Public build variable: `NEXT_PUBLIC_REVENUECAT_API_KEY`

## Development flow

1. Create a RevenueCat project named `WonderCards`.
2. Use the automatically provisioned RevenueCat Test Store.
3. Create one test product and attach it to the `wondercards_plus` entitlement.
4. Add the product to the current Offering and publish a test paywall.
5. Build with the Test Store public SDK key supplied through
   `NEXT_PUBLIC_REVENUECAT_API_KEY`.
6. Test purchase success, cancellation, failure, restore, renewal, and expiry.

The Test Store key is development-only. Never submit it to Google Play.

## Production flow

1. Create the final subscription and pricing in Google Play Console.
2. Connect the Google Play app to the RevenueCat project.
3. Import the Play product and attach it to `wondercards_plus`.
4. Add it to the production Offering.
5. Build the release with the public Google/Android RevenueCat SDK key.
6. Upload to a Play internal-testing track and test with a licence tester.

Google Play product identifiers are permanent after use. Final product IDs,
billing periods, benefits, and prices must be approved before production setup.

## Security

Only RevenueCat public SDK keys belong in the app. Never place RevenueCat secret
API keys, Google service-account credentials, or Play credentials in any
`NEXT_PUBLIC_` variable or commit them to Git.
