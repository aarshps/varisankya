import XCTest
@testable import Varisankya

class ParityTests: XCTestCase {
    
    struct GoldenVectors: Codable {
        let recurrence: RecurrenceVectors
        let currency: CurrencyVectors
    }
    
    struct RecurrenceVectors: Codable {
        let encode: [EncodeCase]
        let decode: [DecodeCase]
        let nextDueDate: [NextDueDateCase]
    }
    
    struct EncodeCase: Codable {
        let unit: String
        let frequency: Int
        let expected: String
    }
    
    struct DecodeCase: Codable {
        let input: String
        let expected: DecodeExpected
    }
    
    struct DecodeExpected: Codable {
        let unit: String
        let frequency: Int
    }
    
    struct NextDueDateCase: Codable {
        let base: String
        let recurrence: String
        let expected: String?
    }
    
    struct CurrencyVectors: Codable {
        let format: [FormatCase]
        let compact: [CompactCase]
    }
    
    struct FormatCase: Codable {
        let amount: Double
        let code: String
        let expected: String
    }
    
    struct CompactCase: Codable {
        let amount: Double
        let expected: String
    }
    
    private func loadGoldenVectors() throws -> GoldenVectors {
        let sourceFile = URL(fileURLWithPath: #filePath)
        let projectDir = sourceFile.deletingLastPathComponent().deletingLastPathComponent()
        let workspaceDir = projectDir.deletingLastPathComponent()
        let jsonURL = workspaceDir.appendingPathComponent("shared/domain/golden-vectors.json")
        let data = try Data(contentsOf: jsonURL)
        return try JSONDecoder().decode(GoldenVectors.self, from: data)
    }
    
    func testParity() throws {
        let vectors = try loadGoldenVectors()
        
        // 1. Recurrence Encode
        for testCase in vectors.recurrence.encode {
            let result = RecurrenceHelper.encode(unit: testCase.unit, frequency: testCase.frequency)
            XCTAssertEqual(result, testCase.expected, "Recurrence encode failed for \(testCase.unit) at \(testCase.frequency)")
        }
        
        // 2. Recurrence Decode
        for testCase in vectors.recurrence.decode {
            let (unit, freq) = RecurrenceHelper.decode(testCase.input)
            XCTAssertEqual(unit, testCase.expected.unit, "Recurrence decode unit failed for \(testCase.input)")
            XCTAssertEqual(freq, testCase.expected.frequency, "Recurrence decode frequency failed for \(testCase.input)")
        }
        
        // 3. nextDueDate
        let df = DateFormatter()
        df.dateFormat = "yyyy-MM-dd"
        df.timeZone = TimeZone(identifier: "UTC")
        
        for testCase in vectors.recurrence.nextDueDate {
            guard let baseDate = df.date(from: testCase.base) else {
                XCTFail("Failed to parse base date \(testCase.base)")
                continue
            }
            let nextDate = RecurrenceHelper.nextDueDate(from: baseDate, recurrence: testCase.recurrence)
            if let expectedStr = testCase.expected {
                guard let next = nextDate else {
                    XCTFail("Expected non-nil next date for \(testCase.base) / \(testCase.recurrence)")
                    continue
                }
                let formattedResult = df.string(from: next)
                XCTAssertEqual(formattedResult, expectedStr, "Next due date failed for \(testCase.base) / \(testCase.recurrence)")
            } else {
                XCTAssertNil(nextDate, "Expected nil next date for \(testCase.base) / \(testCase.recurrence)")
            }
        }
        
        // 4. Currency Format
        for testCase in vectors.currency.format {
            let result = CurrencyHelper.format(testCase.amount, code: testCase.code)
            XCTAssertEqual(result, testCase.expected, "Currency format failed for \(testCase.amount) \(testCase.code)")
        }
        
        // 5. Currency Compact
        for testCase in vectors.currency.compact {
            let result = CurrencyHelper.compactFormat(testCase.amount)
            XCTAssertEqual(result, testCase.expected, "Currency compact failed for \(testCase.amount)")
        }
    }
}
