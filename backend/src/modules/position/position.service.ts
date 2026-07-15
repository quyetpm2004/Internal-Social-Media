import * as positionRepo from "@/modules/position/position.repository";

export async function getAllPositions() {
  return positionRepo.findAllPositions();
}
