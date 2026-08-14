/* ===========================================================================
   packages.js — the content of the three client package decks
   Data only, no logic. deck.js reads this; nothing else does.

   One entry per package, keyed by the value of `data-package` on that deck's
   [data-deck] root in index.html (design / website / app). Change a key here
   and you must change it there, or the deck renders nothing.

   EDIT: this file is where all package copy lives — face cards and layer cards.

     face.icon   basename of a file in icons/, no extension
     face.title  the face card's name; also the toggle's accessible name
     face.sub    the small prompt under the title
     face.col    OPTIONAL accent for the face card. Omitted → the stylesheet's
                 site blue stands. Set it only to recolour one deck's face.

     cards[]     the layers, bottom of the deck to top. Each is self-contained:
       file      basename of a file in icons/, no extension
       col       the layer's accent — its rim, glyph, tag and popped inscription
       name      lowercase tag on the layer; uppercased for the "// NAME" line
       head      inscription heading
       body      inscription text

   The three sets are identical for now; edit them apart freely. Card counts may
   differ per deck, but see SPECS.md §Fan extent — the derived reach figures
   assume five.
   =========================================================================== */

window.PACKAGE_DECKS = {

  design: {
    face: {
      icon:  'reset',
      title: 'Design My Idea',
      sub:   'Click to learn more'
    },
    cards: [
      { file: 'prototype', col: '#4d8dff', name: 'prototype',
        head: 'PROTOTYPE',
        body: 'A prototype makes your design feel real. An interactive proof of concept that can be handed off to any engineer. I build the prototype that you need to prove your idea.' },

      { file: 'brief',       col: '#b06bff', name: 'brief',
        head: 'BRIEF',
        body: 'Your idea is presented as fonts, colours, pages and layouts. A document containing technical details that define your vision. This keeps us and anyone else involved in the project on the same page from start to finish.' },

      { file: 'human',        col: '#39e6b0', name: 'idea',
        head: 'IDEA',
        body: 'Computers are fast, but they do not understand the human experience or the problems we face day to day. I help you ground your idea in the realm of software and give you a realistic view of what is possible.' }
    ]
  },

  website: {
    face: {
      icon:  'reset',
      title: 'Build A Personal Website',
      sub:   'Click to learn more'
    },
    cards: [
      { file: 'debugging',    col: '#ff5a6a', name: 'maintenance',
        head: 'BUG-FIXES',
        body: 'Software is a live and on-going process. Studio NEL will not leave you stranded and quickly patches any errors that occur once your website is live.' },

      { file: 'build-deploy',       col: '#b06bff', name: 'build & deploy',
        head: 'BUILD & DEPLOY',
        body: 'Once you are happy with the design, I build and test the website for you. Only when you are ready do we move to deployment.' },

      { file: 'stack',        col: '#4d8dff', name: 'tech stack',
        head: 'WHAT TYPE OF SITE?',
        body: 'A personal site to control your digital footprint? A landing page for your business? Or full-stack web application? I will build and deploy the site that fits your needs.' },

      { file: 'design',        col: '#39e6b0', name: 'design',
        head: 'DESIGN',
        body: 'Note sure what you want yet? We can work on your idea until you do. See Design My Idea for more details.' }
    ]
  },

  app: {
    face: {
      icon:  'reset',
      title: 'Develope Desktop & Mobile Apps',
      sub:   'Click to learn more'
    },
    cards: [
      { file: 'debugging',    col: '#ff5a6a', name: 'maintenance',
        head: 'ON-GOING SUPPORT',
        body: 'Software is a live and on-going process. Studio NEL will not leave you stranded and provides on-going support to patch any errors that occur once your app is live.' },

      { file: 'analytics',    col: '#b06bff', name: 'analytics',
        head: 'DATA DRIVEN DECISIONS',
        body: 'Collect business data in order to make informed decisions about how your users are interacting with your app, where unreported user-tension occurs and which features get the most attention.' },

      { file: 'architecture',    col: '#4d8dff', name: 'architecture',
        head: 'SCALABLE SYSTEMS',
        body: 'I deploy scalable software which is cheaper to extend, refactor and maintain. This makes it faster to add features or adapt to higher users traffic expected.' },

      { file: 'publish', col: '#2e8f6b', name: 'publish anywhere',
        head: 'CROSS-PLATFORM',
        body: 'Never feel constrained to a single platform. Studio NEL publishes on Windows, macOS, Linux, Andriod and iOS.' },

      { file: 'build-test',       col: '#ffb27a', name: 'build & test',
        head: 'BUILD & TEST',
        body: 'The prototype is developed into a full-stack application. Each feature is systematically tested and progress is regularly reported.' },

      { file: 'prototype',       col: '#39d6e6 ', name: 'prototype',
        head: 'PROTOTYPE',
        body: 'Ensure your idea works in a controlled environment, test ideas before you build and gather feedback before you make a commitment.' },

      { file: 'human',        col: '#39e6b0', name: 'design your idea',
        head: 'DESIGN YOUR CONCEPT',
        body: 'Iterate on a concept until you are ready to build a prototype. See Design My Idea for more details.' }
    ]
  }

};