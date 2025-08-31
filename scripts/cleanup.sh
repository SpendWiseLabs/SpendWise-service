#!/usr/bin/env bash
set -euo pipefail

REGION="${REGION:-us-east-1}"
TAG_KEY="${TAG_KEY:-Project}"
TAG_VAL="${TAG_VAL:-SpendWiseHack}"
DRY_RUN="${DRY_RUN:-1}"   # 1 = simulado (no borra), 0 = aplica

say() { echo -e "$*"; }

say "== Cleanup de demo en $REGION (tag $TAG_KEY=$TAG_VAL) =="
say "DRY_RUN=${DRY_RUN} (1 = simulado, 0 = aplica)"

# --- EIPs sin asociar ---
say "\n-- Buscando EIPs etiquetadas --"
EIP_ALLOCS=$(aws ec2 describe-addresses --region "$REGION" \
  --filters "Name=tag:${TAG_KEY},Values=${TAG_VAL}" \
  --query 'Addresses[?AssociationId==`null`].AllocationId' --output text)

if [ -z "$EIP_ALLOCS" ]; then
  say "No hay EIPs sin asociar con esa etiqueta."
else
  for ALLOC in $EIP_ALLOCS; do
    say "EIP a liberar: $ALLOC"
    if [ "$DRY_RUN" = "0" ]; then
      aws ec2 release-address --region "$REGION" --allocation-id "$ALLOC"
      say "✔ Liberada $ALLOC"
    else
      say "(dry-run) No se liberó $ALLOC"
    fi
  done
fi

# --- Volúmenes EBS 'available' ---
say "\n-- Buscando EBS 'available' etiquetados --"
VOL_IDS=$(aws ec2 describe-volumes --region "$REGION" \
  --filters "Name=tag:${TAG_KEY},Values=${TAG_VAL}" "Name=status,Values=available" \
  --query 'Volumes[].VolumeId' --output text)

if [ -z "$VOL_IDS" ]; then
  say "No hay volúmenes disponibles con esa etiqueta."
else
  for VOL in $VOL_IDS; do
    say "Volumen a borrar: $VOL"
    if [ "$DRY_RUN" = "0" ]; then
      aws ec2 delete-volume --region "$REGION" --volume-id "$VOL"
      say "✔ Borrado $VOL"
    else
      say "(dry-run) No se borró $VOL"
    fi
  done
fi

# --- (Opcional) Instancias etiquetadas ---
if [ "${CLEAN_INSTANCES:-0}" = "1" ]; then
  say "\n-- Buscando instancias etiquetadas (opcional) --"
  INST_IDS=$(aws ec2 describe-instances --region "$REGION" \
    --filters "Name=tag:${TAG_KEY},Values=${TAG_VAL}" "Name=instance-state-name,Values=running,stopped" \
    --query 'Reservations[].Instances[].InstanceId' --output text)
  if [ -z "$INST_IDS" ]; then
    say "No hay instancias para terminar."
  else
    say "Instancias: $INST_IDS"
    if [ "$DRY_RUN" = "0" ]; then
      aws ec2 terminate-instances --region "$REGION" --instance-ids $INST_IDS >/dev/null
      say "✔ Terminación solicitada."
    else
      say "(dry-run) No se terminaron instancias."
    fi
  fi
fi

say "\n✔ Cleanup finalizado."