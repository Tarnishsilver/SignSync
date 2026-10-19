# Development Setup Guide

This guide covers setting up the development environment using **uv** with proper linting, testing, and code review configurations.

## Prerequisites

- Python 3.10+
- [uv](https://docs.astral.sh/uv/) package manager
- Git (for pre-commit hooks)

## Quick Start

### 1. Install UV

On Windows (with PowerShell):
```powershell
irm https://astral.sh/uv/install.ps1 | iex
```

On macOS/Linux:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Set Up Python Environment

```bash
# Create virtual environment and install dependencies
uv sync --all-extras

# Activate the environment
# On Windows:
.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Pre-commit Hooks

```bash
# Install pre-commit framework
uv pip install pre-commit

# Install the git hooks
pre-commit install

# (Optional) Run hooks on all files
pre-commit run --all-files
```

## Development Dependencies

### Main Dependencies
- **opencv-python**: Computer vision library for image processing
- **numpy**: Numerical computing
- **mediapipe**: Hand landmark detection
- **tensorflow**: Deep learning framework
- **scikit-learn**: Machine learning utilities
- **deep-translator**: Language translation

### Development Dependencies

Install with: `uv sync`

- **pytest**: Testing framework
- **pytest-cov**: Coverage reporting
- **black**: Code formatter
- **ruff**: Fast Python linter
- **mypy**: Static type checker
- **pylint**: Code analysis
- **flake8**: Style guide enforcement
- **isort**: Import sorter

### Code Review Dependencies

Install with: `uv sync --extra code-review`

- **code-review-graph**: Code review analysis
- **radon**: Complexity metrics
- **pylint**: Code analysis
- **mypy**: Type checking

### Training Dependencies

Install with: `uv sync --extra training`

- **jupyter**: Notebook environment
- **pandas**: Data manipulation
- **matplotlib**: Plotting library

### Documentation Dependencies

Install with: `uv sync --extra docs`

- **sphinx**: Documentation generator
- **sphinx-rtd-theme**: ReadTheDocs theme

## Common Development Tasks

### Running Tests

pytest is configured in `pyproject.toml` (`testpaths = ["tests"]`, with coverage
reporting enabled by default), but there is no automated test suite yet —
`tests/` currently holds `extract_data_word_list.py`, a data extraction
utility. Once tests are added, the workflow is:

```bash
# Run all tests with coverage
uv run pytest --cov=. --cov-report=html

# Run a specific test file
uv run pytest tests/test_<name>.py -v

# Run tests in parallel
uv run pytest -n auto

# Run tests with a specific marker
uv run pytest -m unit
```

### Code Quality Checks

```bash
# Run all linting tools
uv run ruff check .
uv run black --check .
uv run pylint app.py training.py
uv run mypy . --ignore-missing-imports

# Format code automatically
uv run black .
uv run isort .
uv run ruff check . --fix
```

### Type Checking

```bash
# Check type hints
uv run mypy . --ignore-missing-imports

# Check with HTML report
uv run mypy . --html ./mypy-report
```

### Code Complexity Analysis

```bash
# Analyze code complexity with radon
uv run radon metrics -s .
uv run radon complexity . -nb
```

### Using Tox for Multi-Version Testing

```bash
# Test with multiple Python versions
uv run tox

# Run specific environment
uv run tox -e py311

# Run linting environment
uv run tox -e lint

# Run code review environment
uv run tox -e code-review

# Generate coverage report
uv run tox -e coverage
```

## GitHub Actions: Code Review Graph

The repository includes automated code review analysis via GitHub Actions.

### Features

- **Pylint Analysis**: Code quality analysis
- **Radon Metrics**: Code complexity measurement
- **MyPy Type Checking**: Static type checking
- **Ruff Linting**: Fast linting
- **Code Coverage**: Test coverage reporting
- **PR Comments**: Automated PR comments with analysis summary

### Artifacts

After each workflow run, the following artifacts are generated:
- `code-review-graph.json`: Aggregated analysis results
- `pylint-report.json`: Detailed pylint findings
- `ruff-report.json`: Ruff linting results
- `radon-report.txt`: Complexity metrics
- `coverage.json`: Coverage data
- `mypy-report/`: HTML type checking report

## GitHub Dependabot

Automated dependency updates are configured to run weekly on Mondays.

### Configuration

- **Update Interval**: Weekly (Mondays)
- **Limit**: 10 open pull requests max
- **Labels**: `dependencies`, `github-actions`
- **Reviewers**: Dominators team

## Pre-commit Hooks

Automated checks run before each git commit.

### Configured Hooks

- **trailing-whitespace**: Remove trailing whitespace
- **end-of-file-fixer**: Ensure files end with newline
- **check-yaml**: Validate YAML syntax
- **check-added-large-files**: Prevent large file commits
- **check-json**: Validate JSON syntax
- **check-merge-conflict**: Detect merge conflicts
- **debug-statements**: Find debug statements
- **black**: Code formatting
- **ruff**: Fast linting with fixes
- **mypy**: Type checking
- **pylint**: Code analysis

### Running Pre-commit

```bash
# Run on all files
pre-commit run --all-files

# Run on specific file
pre-commit run --files app.py

# Update hooks
pre-commit autoupdate
```

## UV Command Reference

```bash
# Install exact dependencies from uv.lock
uv sync

# Install with optional extras
uv sync --extra dev
uv sync --extra code-review
uv sync --extra training
uv sync --all-extras

# Run commands in the venv
uv run python script.py
uv run pytest tests/

# Install additional packages
uv pip install package-name

# Export requirements
uv pip compile pyproject.toml -o requirements.txt
```

## Troubleshooting

### Virtual Environment Issues

```bash
# Recreate environment from scratch
rm -r .venv
uv sync

# Clear UV cache
uv cache clean
```

### Import Errors

```bash
# Reinstall all dependencies
uv sync --reinstall --all-extras

# Check Python path
python -c "import sys; print(sys.executable)"
```

### Pre-commit Hook Failures

```bash
# Bypass hooks (not recommended)
git commit --no-verify

# Update and reinstall hooks
pre-commit autoupdate
pre-commit install
```

## Resources

- [UV Documentation](https://docs.astral.sh/uv/)
- [PyProject.toml Spec](https://peps.python.org/pep-0621/)
- [Pre-commit Framework](https://pre-commit.com/)
- [Tox Documentation](https://tox.readthedocs.io/)
- [GitHub Actions](https://docs.github.com/en/actions)

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add new feature"`
3. Push branch: `git push origin feature/my-feature`
4. Create a Pull Request
5. Wait for code review checks to pass
6. Request review and merge

All code must pass:
- Linting (ruff, black, pylint)
- Type checking (mypy)
- Tests (pytest, when a suite is added)
- Pre-commit hooks
