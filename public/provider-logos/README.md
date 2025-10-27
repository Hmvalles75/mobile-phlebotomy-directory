# Provider Logos Directory

This directory stores provider logo images for the Mobile Phlebotomy Directory.

## How to Add a Logo

1. Save the logo image file here with a descriptive name (e.g., `phlebcare-logo.png`)
2. Update the provider's entry in `cleaned_providers.csv`
3. In the `logo` column, reference the file as: `/provider-logos/filename.png`

## Example

For Phlebcare Mobile Lab & DNA Solutions:
- Save logo as: `phlebcare-logo.png`
- CSV logo field: `/provider-logos/phlebcare-logo.png`

## Supported Formats

- PNG (recommended for logos with transparency)
- JPG/JPEG
- WebP
- SVG

## Current Setup

The logo will be displayed:
- On the provider detail page
- In provider cards (when implemented)
- As fallback to profile images
