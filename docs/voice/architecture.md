# Lotavi voice architecture

**Canonical ADR:** [ADR-direct-gemini-live-browser](../architecture/adr/ADR-direct-gemini-live-browser.md)  
**Status:** [current-status.md](./current-status.md)

## Distinctions

| Label | Meaning |
|-------|---------|
| **Current** | Present in the codebase today |
| **Planned** | Target architecture; not fully built |
| **Not yet verified** | Needs real provider/device/network proof |

## Canonical wording

### Current implementation

- Voice safety foundation is implemented.  
- Voice sessions are persisted and ownership-checked.  
- Direct Gemini browser capability code exists.  
- Real provider and device verification remain blocked.  
- Voice is disabled by default.  
- No voice RAG or write tools are enabled.  
- The Lotavi backend is **not** a working Gemini media relay.  
- `GeminiLiveAdapter` is a control-plane / placeholder-shaped adapter, not a verified Live media session.

### Target architecture

- Realtime voice **media** travels directly between the guest browser and Gemini Live.  
- Lotavi remains the **control plane** for authentication, tenant/property scope, token minting, quota, RAG tools, confirmed actions, persistence, audit and telemetry.  
- Text chat continues through the Lotavi backend.  
- PostgreSQL remains the source of truth for business actions.  
- The browser is untrusted and never supplies authoritative tenant or property scope.  
- Gemini may propose actions but cannot persist tickets directly.  
- Consequential actions require server validation and explicit guest confirmation.

## Text path (current + target)

```text
Guest browser
  → Lotavi API
  → RAG / Gemini (server-mediated)
  → Browser
```

## Voice media path (target; capability code current; provider verification blocked)

```text
Guest browser
  ← short-lived ephemeral credential — Lotavi API
  ↔ Gemini Live (direct WebSocket / audio)
```

## Voice control plane (current + planned expansion)

```text
Guest browser
  → Lotavi API:
      guest authentication
      QR / session validation
      tenant / property resolution
      ephemeral credential minting
      allowlist enforcement
      quota and concurrency
      session persistence
      heartbeat
      audit / telemetry
      [Planned] RAG tools
      [Planned] confirmed business actions
```

## Mermaid — canonical system view

```mermaid
flowchart LR
  subgraph Browser["Guest browser"]
    Mic["Microphone capture<br/>Current code / Not yet verified"]
    Play["Audio playback<br/>Current code / Not yet verified"]
    Tx["Transcript events<br/>Current code / Not yet verified"]
    Bridge["Tool bridge<br/>Planned"]
    TextFB["Text fallback<br/>Current"]
  end

  subgraph Lotavi["Lotavi API — control plane"]
    Auth["Guest auth / QR<br/>Current"]
    Scope["Tenant/property resolution<br/>Current"]
    Mint["Ephemeral mint<br/>Current code / Not yet verified"]
    Sess["Voice session persistence<br/>Current"]
    HB["Heartbeat / abandon<br/>Current"]
    Quota["Quota / concurrency<br/>Current"]
    RAG["RAG tool execution<br/>Planned"]
    Confirm["Confirmation + tickets<br/>Planned"]
    Tele["Telemetry<br/>Current diagnostic"]
  end

  subgraph Gemini["Gemini Live"]
    Audio["Realtime audio<br/>Not yet verified"]
    Asr["Transcription<br/>Not yet verified"]
    Fn["Function-call proposals<br/>Planned for voice"]
  end

  subgraph PG["PostgreSQL — SoT"]
    GS["guest sessions — Current"]
    VS["voice sessions — Current"]
    GM["grounding metadata — Planned"]
    TK["tickets — Current for text path"]
    AU["audit — Planned expansion"]
  end

  Mic <-->|direct media Planned/Current spike| Audio
  Play <--> Audio
  Tx -.-> Asr
  Bridge -.-> Fn
  Browser --> Auth
  Auth --> Scope
  Scope --> Mint
  Mint -.->|ephemeral credential| Browser
  Browser --> Sess
  Browser --> HB
  Browser --> TextFB
  TextFB --> Lotavi
  RAG --> PG
  Confirm --> TK
  Sess --> VS
  Auth --> GS
  Fn -.-> Bridge
```

## Component truth table

| Component | Role today | Notes |
|-----------|------------|-------|
| `GeminiLiveAdapter` | Placeholder / canonical event shaping for relay path | **Not** a working media relay |
| `POST …/direct/ephemeral` | Mint path (server key) | Runtime provider smoke **BLOCKED** |
| `VoiceDirectSpike` | Dev/staging experimental UI | Not a production surface |
| Relay WebSocket `/voice/ws` | Ownership-gated control channel | Does not stream real Gemini audio today |
| Text chat | Server RAG path | Operational fallback |

## Observability classes

| Class | Examples | Billing? |
|-------|----------|----------|
| Implemented diagnostic metrics | mint totals, session ended, heartbeat | No |
| Client-reported | first-audio latency, transcript received flags | No |
| Provider-verified | real connect/audio proof | Not yet |
| Billing-authoritative | provider usage reconciliation | **Not implemented** |

Browser-reported duration and transcript events are **not** authoritative billing data.
