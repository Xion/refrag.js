# refrag.js

Breathing new life into URL hash fragments

## What's this?

_Refrag_ strives to reinvent a somehow forgotten idea of **fragment identifiers**
(URL parts after hash <code>#</code>) as references to portions of HTML documents.

A traditional approach is to define an _anchor_ in a form of <code><a></code> tag,
e.g. <code><a name="foo"></code>. This would enable <code>#foo</code> to be used
as fragment identifier. As a result, an URL such as <code>http://www.example.com/#foo</code>
would refer to a place in <code>example.com</code> webpage where the anchor was defined.

Unfortunately, usage of HTML anchors seems to be on decline. If particular website does not
use inner links for itself, it's not uncommon that it lacks anchors even for its headings.
As a consequence, it is normally impossible to construct URLs that point to
a particular fragment, or section of such page.

_Refrag_ attempts to address this issue. Rather than requiring anchors to be placed
manually, _Refrag_ utilizes website's existing markup and text. The idea is to have URL
hash that approximately speficies where a particular portion of document is located.

## Why?

I'm actually scratching my own itch here. Being a blogger, I often encounter a situation where
I'd like to link my readers to a specific section, paragraph, or even sentence, in external article.
It is rarely possible, since the necessary HTML anchors are often missing. And even if they are
present for section headers, smaller portions of the text are pretty much never "indexed" this way.

And frankly, they shouldn't need to be. The content is already there, and its structure is
organized by the markup itself. The only missing piece is a way to refer to that content, with
precision sufficient for practical purposes.

## What's the deal?

_Refrag_ uses a special form of fragment identifier that starts with a caret sign (<code>^</code>),
right after the hash (<code>#</code>). This results in URLs similar to:

    http://www.example.com/article/523#^Text%20within%20article

The text after <code>#^</code> "hashbang" is a content locator, refering to a portion of document.
As in example above, it can be just a text occurring somewhere on the website. Typing such URL
in a browser should result in loading the desired page and scrolling down to the first occurrence
of specified text.

### Specific tags

It is also possible to specify a tag where we'd like the text to be found. This is especially useful
when refering to headings, which usually are enclosed within the <code>h1</code> or <code>h2</code>
elements (or <code>h3</code>, etc.).

To do that, a name of HTML tag should be put at the beginning of "hashbang", and another caret
(<code>^</code>) sign shall separate it from the rest of the text. The full URL might therefore
look like this:

    http://www.example.com/article/523#^h2^A header

## How does it work?

_refrag.js_ implements the mechanism described above as a drop-in JS script. The script can be
painlessly included within a website, making it a potential target for <code>#^</code> links:

```html
<script type="text/javascript" src="refrag.js"></script>
```
When the page is loaded, _refrag.js_ will inspect the URL and search for a hash-caret sequence.
If it's present, it'll take the user to the appropriate page fragment.


## Current state

The project is quite experimental at this point. There are few issues that remain to be addressed, such as:

* Making it possible to refer to elements other than simple text phrases: headings, images, tables, etc.
* Improving the highlight on matched elements (making it less intrusive and more fitting with surrounding CSS)
* Working on cross-browser compatiblity while preserving the lack of external dependencies

If you like the idea of _Refrag_ and how it could improve the Web, don't hesitate to contribute :)
