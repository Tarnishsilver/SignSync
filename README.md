# SignSync

Real-time sign language translation with 3D avatar output. SignSync takes webcam
input, classifies hand shapes and finger gestures with TensorFlow Lite models,
and renders the result as animated sign language on a 3D avatar.

The project is a monorepo containing four surfaces that share one sign lexicon
and one avatar engine:

| Surface | Path | Stack |
|---|---|---|
| Web app | `frontend/` | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Sign detection API | `sign_server.py` | FastAPI, WebSocket, MediaPipe, TensorFlow Lite |
| YouTube companion app | `signtube/` | Next.js 15, Three.js, Zustand |
| Browser extension | `signtube-extension/` | Chrome Manifest V3 |

---

## How it works

```
 webcam frame
      │
      ▼
 MediaPipe Hands ──────► 21 landmarks × (x, y) = 42 features
      │
      ├──► keypoint classifier      static hand shape
      │    42-D input → Dense(20) → Dense(10) → Dense(12)   1,202 params
      │    classes: Open, Close, Pointer, OK, rock, paper, scisor,
      │             tree, home, bad, good
      │
      └──► point history classifier  finger movement over 16 frames
           32-D input → Dense(24) → Dense(10) → Dense(4)       946 params
           classes: hello, thank you, namste, happy
```

Both models are exported to TensorFlow Lite and run on CPU inside the FastAPI
process. The server exposes the predictions over a WebSocket so the browser
never runs inference itself.

**These are small dense MLPs, not CNNs or sequence models.** They classify a
single frame at a time — the point history model works by stacking 16
consecutive index-fingertip positions into one feature vector, not by modelling
temporal dependencies. See [Limitations](#limitations).

## The sign lexicon

`data/categories_files.json` indexes 417 signs across 8 semantic categories:

| Category | Signs |
|---|---|
| Nouns | 227 |
| Verbs | 78 |
| Adjectives | 44 |
| Numbers | 21 |
| Adverbs | 17 |
| Miscellaneous | 15 |
| Prepositions & Conjunctions | 12 |
| Pronouns | 3 |

Each sign is a `.sigml` file under `sigml/` using a HamNoSys-style vocabulary:
418 files, 9,277 markup elements, 164 distinct primitives, 22.2 elements per
sign on average. Signs compose through a small grammar — `hamparbegin`/
`hamparend` for parallel movement, `hamseqbegin`/`hamseqend` for sequence, and
`hamplus` for concatenation.

The lexicon is bilingual: filenames are Arabic, `categories_files.json` keys are
English.

### Markup to animation

```
.sigml  ──XSLT (web-simulator/h2s.xsl)──►  CWA animation  ──►  3D avatar
```

`h2s.xsl` transforms the markup into the CWA animation format, which the
avatar engine renders through Three.js (in `signtube/`) or Spline (in
`frontend/`) with custom GLSL skin shaders.

## Quick start

### Requirements

- Python 3.10–3.12
- Node.js 18+
- A webcam, for the live detection features

### 1. Backend

```bash
pip install -r requirements.txt
python sign_server.py
```

Serves on `http://localhost:8765` (override with the `PORT` environment
variable).

| Endpoint | Purpose |
|---|---|
| `GET /health` | Health check, used by the Railway deploy |
| `GET /labels` | Returns the label set for both classifiers |
| `WS /ws/detect` | WebSocket stream of hand detection results |

### 2. Web app

```bash
cd frontend
npm install
cp .env.example .env.local     # then edit the two URLs
npm run dev
```

Serves on `http://localhost:3000`. Routes: `/` (landing), `/translator` (live
detection), `/learning` (practice modules), `/meeting` (camera + avatar room).

`.env.local`:

```env
NEXT_PUBLIC_SIGN_SERVER=http://localhost:8765
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

### 3. YouTube companion app (optional)

```bash
cd signtube
npm install
npm run dev
```

Scrapes captions from a YouTube video, maps each caption to a sign, and drives
the avatar with it. Routes under `app/api/`: `GET /api/captions`,
`POST /api/process-text`, `GET /api/sigml`.

### 4. Browser extension (optional)

```bash
python signtube-extension/build_extension.py
```

Copies the avatar engine, avatar models, shaders and SiGML files into
`signtube-extension/`, regenerates `sigml/index.json`, and generates the
extension icons. Then load `signtube-extension/` as an unpacked extension in
`chrome://extensions`.

The extension injects a sign avatar next to YouTube videos, driven by the
caption track.

## Training the models

`training.py` is an interactive collection tool — it opens the camera, lets you
name your classes, and appends samples to the right CSV.

```bash
python training.py                       # collect data
python train_keypoint.py --epochs 500    # static hand shapes
python train_point_history.py --epochs 1000 --augment
```

If you add a label you must retrain, otherwise the saved model still has the
old number of output classes and will not predict it. `train_point_history.py`
supports `--augment` for Gaussian noise augmentation.

The current checkpoints were trained on 15,528 keypoint samples and 14,839
point-history samples. See [TRAINING.md](TRAINING.md) for the full workflow.

## Deployment

- **Backend** — Docker image from `Dockerfile`, deployed to Railway. The
  `Procfile` starts `sign_server.py`; `railway.toml` points the health check at
  `/health`.
- **Frontend** — deployed to Vercel. Set `NEXT_PUBLIC_SIGN_SERVER` to the
  Railway backend URL.
- **CI** — `.github/workflows/code-review-graph.yml` runs pylint, radon
  complexity analysis, mypy, and ruff on pull requests; Dependabot and
  pre-commit are configured for dependency and lint enforcement.

## Repository layout

```
frontend/            Next.js web app (translator, learning, meeting)
signtube/            Next.js YouTube companion app
signtube-extension/  Chrome MV3 extension (source; assets are built)
sign_server.py       FastAPI detection service
signtube/lib/nlp.ts  Text simplification for sign lookup
training.py          Interactive data collection
train_*.py           Model training scripts
sigml/               418 sign files (Arabic filenames)
data/                Lexicon index and categories
web-simulator/       Static avatar simulator + h2s.xsl transform
model/               TFLite checkpoints, label CSVs, and training CSVs
tools/               Import and maintenance scripts
```

## Limitations

These are real and worth knowing before evaluating the project:

- **The classifiers are small and lightly trained.** The hand shape model has
  1,202 parameters and 11 classes, the gesture model 946 parameters and 4
  classes. Accuracy has not been measured on a held-out split, so no accuracy
  claim is made here.
- **The training data is partly unlabelled.** 21.2% of the point history
  samples and 13.9% of the keypoint samples point at class indices that have
  no entry in the corresponding label file, and the class distribution is
  heavily skewed — one hand shape class has 4 samples against 2,209 for the
  largest.
- **No context modeling.** Every frame is classified independently. A gesture
  sequence is not interpreted as a phrase.
- **The lexicon is 417 signs.** Coverage of arbitrary speech is low; words
  outside the lexicon are dropped by the current text pipeline.
- **The lexicon lives in three copies** (`sigml/`, `web-simulator/sigml/`,
  `signtube/public/avatar/sigml/`) that are not kept in sync automatically.
- **No automated test suite.** `tests/` contains a data extraction script, not
  unit tests.

## Acknowledgements

- [MediaPipe Hands](https://developers.google.com/mediapipe) for hand landmark
  detection
- [TensorFlow Lite](https://www.tensorflow.org/lite) for on-device inference
- The [CWA](https://github.com/signlanguage/3D-SignLanguage-Avatars-Data) and
  SignWriting avatar assets used by the animation engine

## License

MIT — see [LICENSE](LICENSE).
