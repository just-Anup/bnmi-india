import { databases } from "@/lib/appwrite"

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID
const COLLECTION = "student_installments"
const STUDENT_COLLECTION = "student_admissions"

// DELETE
export const deleteInstallment = async (item, student) => {
  await databases.deleteDocument(DATABASE_ID, COLLECTION, item.$id)

  const newPaid = student.feesReceived - item.amount
  const newBalance = student.totalFees - newPaid

  await databases.updateDocument(
    DATABASE_ID,
    STUDENT_COLLECTION,
    student.$id,
    {
      feesReceived: newPaid,
      balance: newBalance,
    }
  )

  return { success: true }
}

// EDIT
export const editInstallment = async (item, student, newAmount) => {
  await databases.updateDocument(
    DATABASE_ID,
    COLLECTION,
    item.$id,
    { amount: Number(newAmount) }
  )

  const diff = Number(newAmount) - item.amount
  const newPaid = student.feesReceived + diff
  const newBalance = student.totalFees - newPaid

  await databases.updateDocument(
    DATABASE_ID,
    STUDENT_COLLECTION,
    student.$id,
    {
      feesReceived: newPaid,
      balance: newBalance,
    }
  )

  return { success: true }
}