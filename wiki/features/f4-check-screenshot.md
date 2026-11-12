# F4 — Check a screenshot

## Behaviour
- "Upload screenshot" opens the system picker (images only). Image is resized client-side to max
  1600 px long side, JPEG q=0.85, then sent to F2 (Claude reads the text — no OCR library needed).
- Thumbnail preview with an ✕ to remove it. Text and image can be sent together.
- Offline/AI error with only an image → friendly error: "Screenshots need internet. Paste the text instead."

## Done when
- [ ] Selecting an image shows a preview and enables Check.
- [ ] With API mocked, image check shows the AI verdict and the extracted text section.
- [ ] With API down and only an image, the error message appears (no fake verdict).
- [ ] `check_started` has input_type=image (or text_image).
