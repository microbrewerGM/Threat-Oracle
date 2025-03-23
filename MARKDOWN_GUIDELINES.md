# Markdown Guidelines

This document outlines the best practices and guidelines for writing Markdown documents in the Threat Oracle project. Following these guidelines ensures consistency across all documentation and improves readability on GitHub.

## Markdown Linting

We use [markdownlint](https://github.com/DavidAnson/markdownlint) to enforce consistent Markdown formatting. The configuration is defined in `.markdownlint.json` at the root of the repository.

### Installing markdownlint

#### VS Code Extension

1. Install the [markdownlint extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint) for VS Code
2. The extension will automatically use the `.markdownlint.json` configuration file in the project

#### Command Line

```bash
npm install -g markdownlint-cli
```

To lint Markdown files:

```bash
markdownlint "**/*.md"
```

## Markdown Best Practices

### Headers

- Use ATX-style headers (with `#` symbols)
- Include a space after the `#` symbols
- Headers should be surrounded by blank lines
- Only one top-level (H1) header per document
- Header levels should only increment by one level at a time

```markdown
# Top-level Header

## Second-level Header

### Third-level Header
```

### Lists

- Use dashes (`-`) for unordered lists
- Use ordered numbers for ordered lists
- Indent nested lists with 2 spaces
- Lists should be surrounded by blank lines

```markdown
- Item 1
- Item 2
  - Nested item 1
  - Nested item 2
- Item 3

1. First item
2. Second item
   1. Nested ordered item
   2. Another nested item
3. Third item
```

### Code Blocks

- Use fenced code blocks with backticks (```)
- Specify the language for syntax highlighting
- Surround code blocks with blank lines

```markdown
Here is some text.

```python
def hello_world():
    print("Hello, world!")
```

More text here.
```

### Links

- Use reference-style links for better readability in the source
- Use descriptive link text

```markdown
[Visit the GitHub repository][repo]

[repo]: https://github.com/microbrewerGM/Threat-Oracle
```

### Images

- Always include alt text for images
- Use descriptive filenames

```markdown
![Threat Oracle Logo](images/threat-oracle-logo.png)
```

### Emphasis

- Use asterisks for emphasis
- Use double asterisks for strong emphasis
- Don't use spaces inside emphasis markers

```markdown
This is *emphasized* text.
This is **strongly emphasized** text.
```

### Tables

- Use tables for structured data
- Align the pipes for better readability in the source
- Include a header row and separator row

```markdown
| Name     | Type   | Description           |
|----------|--------|-----------------------|
| id       | string | Unique identifier     |
| name     | string | Human-readable name   |
| type     | enum   | Type of technical asset |
```

### Line Length

- Keep lines to a maximum of 120 characters
- Break long paragraphs at sentence boundaries when possible

### File Structure

- Start each file with a top-level header
- Include a brief introduction after the header
- Organize content with clear section headers
- End the file with a single newline character

## GitHub-Specific Formatting

### Task Lists

GitHub supports task lists for tracking progress:

```markdown
- [x] Completed task
- [ ] Incomplete task
```

### References

GitHub automatically links to issues and pull requests:

```markdown
See issue #42
Fixes #123
```

### Collapsible Sections

Use HTML details/summary tags for collapsible sections:

```markdown
<details>
<summary>Click to expand</summary>

This content is hidden by default but can be expanded by clicking.
</details>
```

### Emoji

GitHub supports emoji shortcodes:

```markdown
:rocket: New feature
:bug: Bug fix
:book: Documentation
```

## Additional Resources

- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [Markdown Guide](https://www.markdownguide.org/)
- [GitHub Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
