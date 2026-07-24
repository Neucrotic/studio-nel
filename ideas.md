# Theme - Futuristic Stone Megalith

Earth meets robotic-technology. I want to use a mix of stone surfaces, neon-glow effects and robotic animations to give the website a futuristic feel with a colour pallet and surface textures reminiscent of earth. Magnetic technologies, spiritual energies, primal forces of earth meets psychedelic technology of the future.

I think the big oppurtunity here is to "show off" cool website tricks and for me to just stack as many of these as I can over time.
I need a metalic/stone pallet and I want the elements to react an animate when the mouse moves over. What I really want is to impress myself. I want a flashy website that does all the tricks, is very cool and yet is also just a static webpage. One index.html page for the entire website.
Transformers transforming animation but stone.

#### Sound 
Have a mute toggle buttun under the theme button and play grounding brown noise reminiscent of grinding stone or the churning depths of the ocean. Immerse and focus the visitor, help them associate the site with a feeling of being calm and grounded.

---

# NEL Dashboard App
A place to keep track of the software I have published and am developing, a place to consolidate client contacts for freelance apps and a place to evaluate my income (via Stripe).

## Tech Stack:
### Decided
- **Access** — single machine
- **Architecture** — Model A: always-on ingestion with stored history
- **Client** — Tauri shell, web frontend
- **Server** — rented, provider undecided
- **Door 2 (ingestion)** — resolved by renting: fixed public IP, webhooks land
  directly on a public HTTPS endpoint secured by signature verification.
  Cloudflare Tunnel no longer required (optional extra layer only)

### Tabled — future home migration path
- Raspberry Pi 5, SSD storage, UPS HAT with safe-shutdown signalling
- Cloudflare Tunnel as door 2 in the home topology
- Revisit alongside hardware/robotics tinkering (~next year)

### Open — renting questions
- **Provider** — Hetzner, DigitalOcean, Vultr, Linode, GoDaddy VPS tier, others
- **Server location** — latency + data custody (country where sensitive data
  physically resides)
- **Door 1 (dashboard access)** — Tailscale vs WireGuard vs Headscale.
  Flagged: earlier comparison assumed home topology; a rented server's fixed
  public IP removes plain WireGuard's worst chores (no DDNS, no router
  surgery). Gap between options narrows — re-compare before deciding

### Open — software trunk
- Server OS
- Server-side language (parked at Nel's instruction)
- Framework
- Database

### Parked — Nel to raise
- Backup design — local + remote (3-2-1-shaped)
- Custom-source retry design — ping-until-success with backoff

## Design Brief:
Two primary panels, one for each app:
- A graph on the right showing income, user growth and user types (paying, free, per tier count). The graph can be toggled as to which is displays and for the duration it displays.
- Cards on the left displaying essential stats:
    - Total Users
    - Total Income
    - New Bug Reports (bug reports will come through an automation pipeline which avoids duplicates)
    - Platform Specific Totals (the number of people in the WriteLite discord or total drawings in Kaku)
    - Running costs (if relevant, this could include token usage)

Two primary panels work well, one for each app. This leaves room for above or below.
Above would be a nice header section with the dashboard title + date + motivational quote of the day + wise quote of the day (an extract from a philosphical/religious text) + historically significant events related to the day.
Below would be a stats bar for games, side projects and client apps.
The above bar would be smaller, the below bar would contains a series of its own panels which can be clicked to make that project the focus of the dashboard.
Clicking the primary panels would also make either of them the selected panel.

When a panel is selected the other information animates off screen and the selected panel enlarges. In addition to the dashboard information the selected panel would have things like actionable tasks, things to think about and questions to ask about the project.

On the left is a menu with options for navigation:
- Dashboard (the main app)
- Communication (email inbox system [either a plugin to my existing email or my own system])
- Finance (access to Stripe accounts, income stats, running costs etc)
- Focus (a personalised set of tools to help me focus: timers, brown noise, music, breathing techniques and anything else I can add to it)