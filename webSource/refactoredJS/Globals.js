/**
 * Merges two objects recursively that each property of sourceObject will appear in object. Note
 * that if property of sourceObject is an object, to "object" will be copied only a reference to
 * this object.
 *
 * @param {object} object - Object where new properties will be inserted.
 * @param {object} sourceObject - Object to copy properties from.
 */
var mergeObjectProperties = function (object, sourceObject) {

    var property;

    for (property in sourceObject) {

        sourceObject[property] = object[property];

    }

};