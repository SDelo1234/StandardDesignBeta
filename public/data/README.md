# Data Assets

Place CSV files referenced by the application in this directory. Files here will be deployed with the Vite build output so they are accessible at runtime.

## Expected datasets

The fence design wizard loads two postcode-indexed datasets at runtime:

- `Postcode_elevation.csv` provides elevation in metres above ordnance datum.
- `vbpostcode.csv` provides the design wind speed (and optionally wind pressure).

Each file should contain a header row. The application looks for columns containing the words `postcode`, `altitude`/`elevation`, `wind speed`, or `pressure`. Values are matched case-insensitively on the longest available postcode prefix. When both wind speed and pressure are supplied, pressure values are assumed to be in kPa; otherwise they are derived from the supplied wind speed.

Sample files are included for development and may be replaced with project-specific datasets.
