import * as departmentRepo from "@/modules/department/department.repository";

export async function getAllDepartments() {
  return departmentRepo.findAllDepartments();
}
