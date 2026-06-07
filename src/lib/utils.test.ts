import { strict as assert } from "assert";
import { getFullName, getBirthDate } from "./utils";

// Mock Member object
const mockMember = {
  id: "1",
  first_name: "John",
  middle_name: "David",
  last_name: "Doe",
  date_of_birth: "1990-05-15",
  position: "Deacon",
  photo_url: null,
  is_active: true,
  created_at: "",
  updated_at: "",
};

console.log("Running tests for utils.ts...");

try {
  // Test getFullName
  assert.equal(getFullName(mockMember), "John David Doe");
  assert.equal(getFullName({ ...mockMember, middle_name: null }), "John Doe");
  console.log("[OK] getFullName passed");

  // Test getBirthDate
  // Note: Date locale string might vary by system locale, but "en-US" is specified in the function
  assert.equal(getBirthDate(mockMember), "May 15");
  console.log("[OK] getBirthDate passed");

  console.log("All tests passed!");
} catch (error) {
  console.error("[FAIL] Test failed:", error);
  process.exit(1);
}
