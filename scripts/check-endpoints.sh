#!/bin/bash
# ============================================================================
# Drupal REST Endpoint Health Check
# ============================================================================
# Tests all known endpoints against the Drupal backend and reports status.
# Run when the local Drupal database is online.
#
# Usage:
#   ./scripts/check-endpoints.sh [BASE_URL]
#
# Default BASE_URL: http://192.168.86.201/www.sicis.com_aiweb/httpdocs
# ============================================================================

BASE="${1:-http://192.168.86.201/www.sicis.com_aiweb/httpdocs}"
LOCALE="it"
TIMEOUT=10

# ── Dynamic NID/TID discovery ──────────────────────────────────────────────
# Fetches real NIDs from listing endpoints so single-product checks use valid IDs.
# Falls back to hardcoded values if the listing endpoint is unreachable.

extract_nid() {
  # Extract first "nid":"NNN" from a JSON array response
  local url="$1"
  local nid
  nid=$(curl -s --max-time "$TIMEOUT" "$url" 2>/dev/null | grep -o '"nid":"[0-9]*"' | head -1 | grep -o '[0-9]*')
  echo "${nid:-0}"
}

echo "  Discovering valid NIDs from listing endpoints..."
echo ""

MOSAIC_NID=$(extract_nid "$BASE/$LOCALE/api/v1/mosaic-products/58/1")
VETRITE_NID=$(extract_nid "$BASE/$LOCALE/api/v1/vetrite-products/all/all")
TEXTILE_NID=$(extract_nid "$BASE/$LOCALE/api/v1/textile-products/all")
PIXALL_NID=$(extract_nid "$BASE/$LOCALE/api/v1/pixall-products")

# TID/category NIDs (static — these are taxonomy terms / categoria nodes, stable)
SAMPLE_TID=58
SAMPLE_COLOR_TID=1
SAMPLE_CATEGORY_NID=3545

echo "  Mosaic NID:  ${MOSAIC_NID:-none}"
echo "  Vetrite NID: ${VETRITE_NID:-none}"
echo "  Textile NID: ${TEXTILE_NID:-none}"
echo "  Pixall NID:  ${PIXALL_NID:-none}"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
GRAY='\033[0;90m'
NC='\033[0m'

echo ""
echo "=============================================="
echo "  Drupal REST Endpoint Health Check"
echo "=============================================="
echo "  Base URL: $BASE"
echo "  Locale:   $LOCALE"
echo "  Timeout:  ${TIMEOUT}s"
echo "=============================================="
echo ""

check() {
  local label="$1"
  local url="$2"
  local group="$3"

  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null)

  if [ "$status" = "200" ]; then
    printf "  ${GREEN}%-3s${NC}  %-30s  %s\n" "$status" "$label" "${GRAY}$url${NC}"
  elif [ "$status" = "000" ]; then
    printf "  ${RED}TMO${NC}  %-30s  %s\n" "$label" "${GRAY}timeout${NC}"
  elif [ "$status" = "404" ]; then
    printf "  ${RED}%-3s${NC}  %-30s  %s\n" "$status" "$label" "${GRAY}disabled or missing${NC}"
  else
    printf "  ${YELLOW}%-3s${NC}  %-30s  %s\n" "$status" "$label" "${GRAY}$url${NC}"
  fi
}

# ── NEW endpoints (expected: all 200) ─────────────────────────────────────

echo "--- NEW endpoints (definitive) ---"
echo ""
check "resolve-path"       "$BASE/$LOCALE/api/v1/resolve-path?path=/mosaico/pluma"   "new"
check "mosaic-product"     "$BASE/$LOCALE/api/v1/mosaic-product/$MOSAIC_NID"          "new"
check "vetrite-product"    "$BASE/$LOCALE/api/v1/vetrite-product/$VETRITE_NID"       "new"
check "textile-product"    "$BASE/$LOCALE/api/v1/textile-product/$TEXTILE_NID"       "new"
check "pixall-product"     "$BASE/$LOCALE/api/v1/pixall-product/$PIXALL_NID"         "new"
check "mosaic-products"    "$BASE/$LOCALE/api/v1/mosaic-products/$SAMPLE_TID/$SAMPLE_COLOR_TID" "new"
check "vetrite-products"   "$BASE/$LOCALE/api/v1/vetrite-products/all/all"            "new"
check "textile-products"   "$BASE/$LOCALE/api/v1/textile-products/all"                "new"
check "pixall-products"    "$BASE/$LOCALE/api/v1/pixall-products"                     "new"
check "mosaic-colors"      "$BASE/$LOCALE/api/v1/mosaic-colors"                       "new"
check "mosaic-collections" "$BASE/$LOCALE/api/v1/mosaic-collections"                  "new"

echo ""
echo "--- OLD endpoints (status unknown — verify) ---"
echo ""
check "entity"             "$BASE/$LOCALE/api/v1/entity?path=/mosaico"                "old"
check "translate-path"     "$BASE/$LOCALE/api/v1/translate-path?path=/mosaico&from=it&to=en" "old"
check "products"           "$BASE/$LOCALE/api/v1/products/prodotto_mosaico?items_per_page=1" "old"
check "product-counts"     "$BASE/$LOCALE/api/v1/products/prodotto_mosaico/counts/collection" "old"
check "taxonomy"           "$BASE/$LOCALE/api/v1/taxonomy/mosaico_collezioni"          "old"
check "category-options"   "$BASE/$LOCALE/api/v1/category-options/prodotto_arredo"     "old"
check "blog"               "$BASE/$LOCALE/api/v1/blog?items_per_page=1"               "old"
check "projects"           "$BASE/$LOCALE/api/v1/projects?items_per_page=1"            "old"
check "environments"       "$BASE/$LOCALE/api/v1/environments?items_per_page=1"        "old"
check "showrooms"          "$BASE/$LOCALE/api/v1/showrooms"                            "old"
check "documents"          "$BASE/$LOCALE/api/v1/documents?items_per_page=1"           "old"
check "subcategories"      "$BASE/$LOCALE/api/v1/subcategories/$SAMPLE_CATEGORY_NID"   "old"
check "pages-by-category"  "$BASE/$LOCALE/api/v1/pages-by-category/$SAMPLE_CATEGORY_NID" "old"
check "menu"               "$BASE/$LOCALE/api/menu/main"                               "old"

echo ""
echo "=============================================="
echo "  Legend: ${GREEN}200${NC} = active  ${RED}404${NC} = disabled  ${YELLOW}4xx${NC} = error  ${RED}TMO${NC} = timeout"
echo "=============================================="
echo ""
