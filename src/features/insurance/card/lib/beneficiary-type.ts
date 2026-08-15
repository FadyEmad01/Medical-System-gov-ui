import type { DependentResponseDto } from "../../enrollment/types";
import type { CardResponseDto } from "../../types";

/**
 * Arabic badge label per dependent relationship type (product decision).
 * Deliberately "طفل" instead of the enrollment wizard's i18n label
 * dependents.relationship.Child ("ابن/ابنة"): the card badge is a
 * beneficiary-category label and the card body is hardcoded Arabic in both
 * locales per product decision — the card intentionally does NOT consume the
 * enrollment i18n vocabulary.
 */
export const RELATIONSHIP_TYPE_LABELS: Record<
  DependentResponseDto["relationshipType"],
  string
> = {
  Child: "طفل",
  Spouse: "زوج/زوجة",
  Parent: "والد/والدة",
  Guardian: "ولي أمر",
};

/**
 * Resolves the Arabic beneficiary-category label for the card's holder.
 *
 * A card without `dependentPersonId` belongs to the head of household.
 * The dependent lookup deliberately does NOT filter on isActive/endedAt: the
 * ready state requires `Active && isCurrentlyValid` (lib/card-status.ts), so an
 * ended relationship would already have revoked the card — filtering would
 * wrongly render "—" for a genuinely issued dependent card.
 */
export function resolveBeneficiaryType(
  card: CardResponseDto | null | undefined,
  dependents: DependentResponseDto[] | undefined,
): string {
  if (!card?.dependentPersonId) return "رب الأسرة";

  const dependent = dependents?.find(
    (d) => d.dependentPersonId === card.dependentPersonId,
  );
  return dependent ? RELATIONSHIP_TYPE_LABELS[dependent.relationshipType] : "—";
}
