import Foundation
import SwiftSoup

class SchemaRecipeParser {

    func parse(html: String, url: String) -> [String: Any] {
        do {
            let doc = try SwiftSoup.parse(html)
            let scripts = try doc.select("script[type=application/ld+json]")

            for script in scripts {
                let jsonText = try script.html()
                if let recipe = extractRecipe(from: jsonText, url: url, html: html) {
                    return ["success": true, "data": recipe]
                }
            }

            return errorResult(type: "NoRecipeFoundError", message: "No schema.org Recipe found in HTML")
        } catch {
            return errorResult(type: "ParseError", message: error.localizedDescription)
        }
    }

    private func extractRecipe(from jsonText: String, url: String, html: String) -> [String: Any?]? {
        guard let data = jsonText.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) else {
            return nil
        }

        if let recipe = findRecipe(in: json) {
            return mapToScrapedRecipe(recipe, url: url, html: html)
        }

        return nil
    }

    private func findRecipe(in json: Any) -> [String: Any]? {
        if let dict = json as? [String: Any] {
            if let type = dict["@type"] {
                if isRecipeType(type) {
                    return dict
                }
            }

            if let graph = dict["@graph"] as? [[String: Any]] {
                for item in graph {
                    if let type = item["@type"], isRecipeType(type) {
                        return item
                    }
                }
            }

            for (_, value) in dict {
                if let found = findRecipe(in: value) {
                    return found
                }
            }
        }

        if let array = json as? [Any] {
            for item in array {
                if let found = findRecipe(in: item) {
                    return found
                }
            }
        }

        return nil
    }

    private func isRecipeType(_ type: Any) -> Bool {
        if let typeString = type as? String {
            return typeString == "Recipe" || typeString.hasSuffix("/Recipe")
        }
        if let typeArray = type as? [String] {
            return typeArray.contains("Recipe") || typeArray.contains { $0.hasSuffix("/Recipe") }
        }
        return false
    }

    private func mapToScrapedRecipe(_ recipe: [String: Any], url: String, html: String) -> [String: Any?] {
        let host = extractHost(from: url)

        return [
            "title": recipe["name"] as? String,
            "description": recipe["description"] as? String,
            "ingredients": extractIngredients(recipe),
            "ingredientGroups": nil as Any?,
            "instructions": extractInstructionsString(recipe),
            "instructionsList": extractInstructionsList(recipe),
            "totalTime": parseISO8601Duration(recipe["totalTime"]),
            "prepTime": parseISO8601Duration(recipe["prepTime"]),
            "cookTime": parseISO8601Duration(recipe["cookTime"]),
            "yields": extractYields(recipe),
            "image": extractImage(recipe),
            "host": host,
            "canonicalUrl": recipe["url"] as? String ?? url,
            "siteName": nil as Any?,
            "author": extractAuthor(recipe),
            "language": recipe["inLanguage"] as? String,
            "category": extractStringOrFirst(recipe["recipeCategory"]),
            "cuisine": extractStringOrFirst(recipe["recipeCuisine"]),
            "cookingMethod": extractStringOrFirst(recipe["cookingMethod"]),
            "keywords": extractKeywords(recipe, html: html),
            "dietaryRestrictions": extractDietaryRestrictions(recipe),
            "ratings": extractRating(recipe),
            "ratingsCount": extractRatingsCount(recipe),
            "nutrients": extractNutrients(recipe),
            "equipment": nil as Any?,
            "links": nil as Any?
        ]
    }

    private func extractHost(from urlString: String) -> String? {
        guard let url = URL(string: urlString) else { return nil }
        return url.host
    }

    private func extractIngredients(_ recipe: [String: Any]) -> [String] {
        if let ingredients = recipe["recipeIngredient"] as? [String] {
            return ingredients
        }
        if let ingredient = recipe["recipeIngredient"] as? String {
            return [ingredient]
        }
        return []
    }

    private func extractInstructionsString(_ recipe: [String: Any]) -> String? {
        if let instructions = recipe["recipeInstructions"] as? String {
            return instructions
        }

        if let list = extractInstructionsList(recipe), !list.isEmpty {
            return list.joined(separator: "\n")
        }

        return nil
    }

    private func extractInstructionsList(_ recipe: [String: Any]) -> [String]? {
        guard let instructions = recipe["recipeInstructions"] else { return nil }

        if let instructionString = instructions as? String {
            return instructionString.components(separatedBy: "\n").filter { !$0.isEmpty }
        }

        if let instructionArray = instructions as? [Any] {
            var result: [String] = []

            for item in instructionArray {
                if let text = item as? String {
                    result.append(text)
                } else if let step = item as? [String: Any] {
                    if let text = step["text"] as? String {
                        result.append(text)
                    } else if let name = step["name"] as? String {
                        result.append(name)
                    }

                    if let itemListElement = step["itemListElement"] as? [[String: Any]] {
                        for element in itemListElement {
                            if let text = element["text"] as? String {
                                result.append(text)
                            }
                        }
                    }
                }
            }

            return result.isEmpty ? nil : result
        }

        return nil
    }

    private func parseISO8601Duration(_ value: Any?) -> Int? {
        guard let durationString = value as? String else { return nil }

        var minutes = 0
        var hours = 0
        var days = 0

        let pattern = "P(?:(\\d+)D)?T?(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else {
            return nil
        }

        let range = NSRange(durationString.startIndex..., in: durationString)
        guard let match = regex.firstMatch(in: durationString, options: [], range: range) else {
            return nil
        }

        if let dayRange = Range(match.range(at: 1), in: durationString),
           let dayValue = Int(durationString[dayRange]) {
            days = dayValue
        }

        if let hourRange = Range(match.range(at: 2), in: durationString),
           let hourValue = Int(durationString[hourRange]) {
            hours = hourValue
        }

        if let minuteRange = Range(match.range(at: 3), in: durationString),
           let minuteValue = Int(durationString[minuteRange]) {
            minutes = minuteValue
        }

        let totalMinutes = days * 24 * 60 + hours * 60 + minutes
        return totalMinutes > 0 ? totalMinutes : nil
    }

    private func extractYields(_ recipe: [String: Any]) -> String? {
        if let yields = recipe["recipeYield"] as? String {
            return yields
        }
        if let yieldsArray = recipe["recipeYield"] as? [Any], let first = yieldsArray.first {
            if let str = first as? String {
                return str
            }
            if let num = first as? Int {
                return "\(num) servings"
            }
        }
        if let yields = recipe["recipeYield"] as? Int {
            return "\(yields) servings"
        }
        return nil
    }

    private func extractImage(_ recipe: [String: Any]) -> String? {
        if let image = recipe["image"] as? String {
            return image
        }
        if let imageObj = recipe["image"] as? [String: Any] {
            return imageObj["url"] as? String
        }
        if let imageArray = recipe["image"] as? [Any], let first = imageArray.first {
            if let str = first as? String {
                return str
            }
            if let obj = first as? [String: Any] {
                return obj["url"] as? String
            }
        }
        return nil
    }

    private func extractAuthor(_ recipe: [String: Any]) -> String? {
        if let author = recipe["author"] as? String {
            return author
        }
        if let authorObj = recipe["author"] as? [String: Any] {
            return authorObj["name"] as? String
        }
        if let authorArray = recipe["author"] as? [Any], let first = authorArray.first {
            if let str = first as? String {
                return str
            }
            if let obj = first as? [String: Any] {
                return obj["name"] as? String
            }
        }
        return nil
    }

    private func extractStringOrFirst(_ value: Any?) -> String? {
        if let str = value as? String {
            return str
        }
        if let arr = value as? [String], let first = arr.first {
            return first
        }
        return nil
    }

    private func extractKeywords(_ recipe: [String: Any], html: String) -> [String]? {
        if let keywords = recipe["keywords"] as? String {
            return keywords.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) }
        }
        if let keywords = recipe["keywords"] as? [String], !keywords.isEmpty {
            return keywords
        }

        // Fallback: extract from __NEXT_DATA__ if available
        if let nextDataKeywords = extractKeywordsFromNextData(html), !nextDataKeywords.isEmpty {
            return nextDataKeywords
        }

        return nil
    }

    private func extractKeywordsFromNextData(_ html: String) -> [String]? {
        let pattern = "<script[^>]*id=[\"']__NEXT_DATA__[\"'][^>]*>([\\s\\S]*?)</script>"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else {
            return nil
        }

        let range = NSRange(html.startIndex..., in: html)
        guard let match = regex.firstMatch(in: html, options: [], range: range),
              let contentRange = Range(match.range(at: 1), in: html) else {
            return nil
        }

        let jsonText = String(html[contentRange])
        guard let data = jsonText.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) else {
            return nil
        }

        return findTagsInDict(json)
    }

    private func findTagsInDict(_ data: Any, depth: Int = 0) -> [String]? {
        if depth > 10 { return nil }

        if let dict = data as? [String: Any] {
            for key in ["tags", "labels"] {
                if let tags = dict[key] as? [Any] {
                    var result: [String] = []

                    for tag in tags {
                        guard isUserFacingTag(tag) else { continue }

                        if let tagString = tag as? String, !tagString.isEmpty {
                            result.append(tagString)
                        } else if let tagDict = tag as? [String: Any],
                                  let name = tagDict["name"] as? String, !name.isEmpty {
                            result.append(name)
                        }
                    }

                    if !result.isEmpty { return result }
                }
            }

            for (_, value) in dict {
                if let found = findTagsInDict(value, depth: depth + 1) {
                    return found
                }
            }
        }

        if let array = data as? [Any] {
            for item in array {
                if let found = findTagsInDict(item, depth: depth + 1) {
                    return found
                }
            }
        }

        return nil
    }

    private func isUserFacingTag(_ tag: Any) -> Bool {
        guard let tagDict = tag as? [String: Any] else {
            return true // Plain strings pass through
        }

        // Only include tags explicitly marked for display (both naming conventions)
        if let displayLabel = tagDict["displayLabel"] as? Bool, displayLabel == true {
            return true
        }
        if let displayLabel = tagDict["display_label"] as? Bool, displayLabel == true {
            return true
        }

        return false
    }

    private func extractDietaryRestrictions(_ recipe: [String: Any]) -> [String]? {
        guard let suitable = recipe["suitableForDiet"] else { return nil }

        if let diet = suitable as? String {
            return [cleanDietName(diet)]
        }
        if let diets = suitable as? [String] {
            return diets.map { cleanDietName($0) }
        }
        return nil
    }

    private func cleanDietName(_ diet: String) -> String {
        return diet
            .replacingOccurrences(of: "https://schema.org/", with: "")
            .replacingOccurrences(of: "http://schema.org/", with: "")
    }

    private func extractRating(_ recipe: [String: Any]) -> Double? {
        if let rating = recipe["aggregateRating"] as? [String: Any] {
            if let value = rating["ratingValue"] as? Double {
                return value
            }
            if let value = rating["ratingValue"] as? String {
                return Double(value)
            }
            if let value = rating["ratingValue"] as? Int {
                return Double(value)
            }
        }
        return nil
    }

    private func extractRatingsCount(_ recipe: [String: Any]) -> Int? {
        if let rating = recipe["aggregateRating"] as? [String: Any] {
            if let count = rating["ratingCount"] as? Int {
                return count
            }
            if let count = rating["ratingCount"] as? String {
                return Int(count)
            }
            if let count = rating["reviewCount"] as? Int {
                return count
            }
            if let count = rating["reviewCount"] as? String {
                return Int(count)
            }
        }
        return nil
    }

    private func extractNutrients(_ recipe: [String: Any]) -> [String: String]? {
        guard let nutrition = recipe["nutrition"] as? [String: Any] else { return nil }

        var result: [String: String] = [:]

        let mapping: [(schemaKey: String, outputKey: String)] = [
            ("calories", "calories"),
            ("carbohydrateContent", "carbohydrateContent"),
            ("proteinContent", "proteinContent"),
            ("fatContent", "fatContent"),
            ("fiberContent", "fiberContent"),
            ("sodiumContent", "sodiumContent"),
            ("sugarContent", "sugarContent"),
            ("saturatedFatContent", "saturatedFatContent"),
            ("cholesterolContent", "cholesterolContent"),
            ("servingSize", "servingSize")
        ]

        for (schemaKey, outputKey) in mapping {
            if let value = nutrition[schemaKey] as? String {
                result[outputKey] = value
            } else if let value = nutrition[schemaKey] as? Int {
                result[outputKey] = String(value)
            } else if let value = nutrition[schemaKey] as? Double {
                result[outputKey] = String(value)
            }
        }

        return result.isEmpty ? nil : result
    }

    private func errorResult(type: String, message: String) -> [String: Any] {
        return [
            "success": false,
            "error": [
                "type": type,
                "message": message
            ]
        ]
    }
}
