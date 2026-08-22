# Legacy (pre-VVAH-reboot)

Everything under this directory is the prior from-scratch implementation
(Python schema/graph backend, D3/React frontend, CWE/ATT&CK importers,
tests, Docker build files) from before the VVAH-engine reboot. Kept for
reference and traceability — not part of the active project. Full history
is also in git log and the `archive/pre-vvah-reboot` tag on `main`.

Do not build new work on top of this. See ../README.md and the private
`threat-oracle-internal` repo's `FEATURES_STATUS_TRACKING.md` for current
direction. `../data/` (CWE/CAPEC/ATT&CK reference datasets) and `../docs/`
were kept at top level — still potentially useful reference material, not
tied to the old implementation.
