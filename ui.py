"""Presentation components inspired by PTSD's ByteCoders command center."""

from html import escape

import streamlit as st

from model_pipeline import ROOT

# A code-native vehicle illustration keeps the interface independent of image APIs.
VEHICLE_SVG = """
<svg viewBox="0 0 540 200" role="img" aria-label="Illustrated vehicle silhouette">
  <defs>
    <linearGradient id="body" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#898b92"/><stop offset=".45" stop-color="#4b4c53"/><stop offset="1" stop-color="#222329"/></linearGradient>
    <linearGradient id="window" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9ca0ac" stop-opacity=".7"/><stop offset="1" stop-color="#242730"/></linearGradient>
    <radialGradient id="wheel"><stop stop-color="#44474f"/><stop offset=".5" stop-color="#b0b2ba"/><stop offset=".56" stop-color="#24252a"/><stop offset="1" stop-color="#090a0c"/></radialGradient>
  </defs>
  <g stroke="#ffffff" stroke-opacity=".055" stroke-width="1">
    <path d="M20 170H520M20 140H520M20 110H520M20 80H520M20 50H520"/>
    <path d="M70 30V190M170 30V190M270 30V190M370 30V190M470 30V190"/>
  </g>
  <ellipse cx="274" cy="165" rx="219" ry="14" fill="#000" opacity=".5"/>
  <path d="M43 128 61 108 132 94 182 57Q192 49 214 49H330Q355 51 379 83L401 99 457 109Q487 114 495 132L490 153H48Z" fill="url(#body)" stroke="#bcc0ca" stroke-opacity=".65"/>
  <path d="M145 94 190 61Q199 57 214 57H254V94Z" fill="url(#window)" stroke="#acb0b8" stroke-opacity=".5"/>
  <path d="M264 57H327Q345 58 368 85L379 96H264Z" fill="url(#window)" stroke="#acb0b8" stroke-opacity=".5"/>
  <path d="M138 102 132 145M258 100V147M390 102 396 145M55 128 484 128" fill="none" stroke="#c6c8d0" stroke-opacity=".24"/>
  <path d="M153 109H169M277 109H293" stroke="#c8cbd0" stroke-width="2"/>
  <path d="M453 117 481 123 477 131H456Z" fill="#e6eaf0"/>
  <path d="M52 119 64 116 66 128H48Z" fill="#93959b"/>
  <path d="M66 147H478" stroke="#b6bac3" stroke-opacity=".35"/>
  <circle cx="124" cy="146" r="31" fill="#0b0c0f"/><circle cx="124" cy="146" r="25" fill="url(#wheel)"/>
  <circle cx="421" cy="146" r="31" fill="#0b0c0f"/><circle cx="421" cy="146" r="25" fill="url(#wheel)"/>
  <circle cx="124" cy="146" r="6" fill="#9ca0a8"/><circle cx="421" cy="146" r="6" fill="#9ca0a8"/>
  <g stroke="#ffffff" stroke-opacity=".32"><path d="M102 146H146M124 124V168M399 146H443M421 124V168"/></g>
</svg>"""


def apply_style():
    css = (ROOT / "assets" / "style.css").read_text(encoding="utf-8")
    st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)


def render_hero(key, rows, median_price, test_r2):
    stage_titles = {"v3": "Detailed vehicle specifications", "v4": "Location & specification intelligence", "basic": "Essential vehicle intelligence", "small": "Cars & motorcycles"}
    stage_title = escape(stage_titles[key])
    code = escape(key.upper())
    st.markdown(f"""<div class="topbar"><div class="topbar-brand">CARDEKHO / PRICE INTELLIGENCE</div><div class="topbar-meta"><span class="status-dot"></span> MODELS LOADED · PROJECT DEMO</div></div>
<section class="hero">
  <div>
    <div class="eyebrow">THE VEHICLE VALUATION WORKSPACE</div>
    <h1>Every car.<br>A clearer<br><em>perspective.</em></h1>
    <div class="hero-copy">Explore the details. Understand the data. Estimate resale value with a model built from real vehicle listings.</div>
    <div class="hero-tags"><span>04 DATA SOURCES</span><span>03 ALGORITHMS</span><span>12 EXPERIMENTS</span></div>
  </div>
  <div class="vehicle-stage">
    <div class="stage-header"><span>VEHICLE PROFILE / {code}</span><span>01 — PRICE LAB</span></div>
    {VEHICLE_SVG}
    <div class="stage-footer"><div><strong>{stage_title}</strong><small>HISTORICAL LISTINGS · INR</small></div><span class="stage-code">CD / {code}</span></div>
  </div>
</section>
<div class="overview-strip">
  <div class="overview-stat"><span>Active dataset</span><strong>{code}</strong></div>
  <div class="overview-stat"><span>Cleaned listings</span><strong>{rows:,}</strong></div>
  <div class="overview-stat"><span>Median listing price</span><strong>₹{median_price / 100_000:.2f} lakh</strong></div>
  <div class="overview-stat"><span>Independent test R²</span><strong>{test_r2:.3f}</strong></div>
</div>""", unsafe_allow_html=True)


def section_heading(number, title, description):
    st.markdown(f'<div class="section-head"><h2>{escape(title)}</h2><span class="section-number">{escape(number)} / PRICE LAB</span></div><div class="section-copy">{escape(description)}</div>', unsafe_allow_html=True)


def render_result(estimate, vehicle, model_name):
    st.markdown(f"""
<div class="result-card">
  <span class="tag">VALUATION COMPLETE</span>
  <div class="eyebrow">ESTIMATED RESALE VALUE</div>
  <div class="result-price">₹{estimate:,.0f}</div>
  <div class="result-detail">₹{estimate / 100_000:.2f} lakh · {escape(vehicle.title())}<br>Estimated using {escape(model_name)} · Historical listing data</div>
</div>""", unsafe_allow_html=True)


def render_method():
    st.markdown("""
<div class="method-grid">
  <div class="method-card"><span class="step">01 / LEARN</span><h3>Train on 60%.</h3><p>Clean the records, keep identical feature rows together, and fit preprocessing inside each model pipeline.</p></div>
  <div class="method-card"><span class="step">02 / SELECT</span><h3>Validate on 20%.</h3><p>Compare three algorithms on the same validation groups. The lowest validation RMSE selects the model.</p></div>
  <div class="method-card"><span class="step">03 / EVALUATE</span><h3>Test on 20%.</h3><p>Report results on held-out groups. Then refit all three pipelines on the complete dataset for the demo.</p></div>
</div>""", unsafe_allow_html=True)


def render_footer():
    st.markdown('<div class="footer"><span>CARDEKHO / VEHICLE PRICE LAB</span><span>HISTORICAL DATA · REPRODUCIBLE MODELS · INDEPENDENT TESTING</span></div>', unsafe_allow_html=True)
