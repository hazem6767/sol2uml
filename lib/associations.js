"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAssociatedClass = void 0;
const umlClass_1 = require("./umlClass");
// Find the UML class linked to the association
const findAssociatedClass = (association, sourceUmlClass, umlClasses, searchedAbsolutePaths = []) => {
    let umlClass = umlClasses.find((targetUmlClass) => {
        // is the source class link via the association to the target class?
        if (isAssociated(association, sourceUmlClass, targetUmlClass))
            return true;
        // Not linked so now try linking to target under the node_modules folder.
        // eg remove node_modules from node_modules/@openzeppelin/contracts-upgradeable/proxy/Initializable.sol
        // is the target class under node_modules?
        if (targetUmlClass.relativePath.match(/^node_modules\//)) {
            // clone the target and updated absolutePath and relativePath so it's no longer under node_modules
            const clonedTargetClass = new umlClass_1.UmlClass(targetUmlClass);
            clonedTargetClass.absolutePath =
                targetUmlClass.absolutePath.replace(/^node_modules\//, '');
            clonedTargetClass.relativePath =
                targetUmlClass.relativePath.replace(/^node_modules\//, '');
            // is the source class link via the association to the target class?
            return isAssociated(association, sourceUmlClass, clonedTargetClass);
        }
        // could not find a link from the source to target via the association
        return false;
    });
    // If a link was found
    if (umlClass)
        return umlClass;
    // Could not find a link so now need to recursively look at imports of imports
    // add to already recursively processed files to avoid getting stuck in circular imports
    searchedAbsolutePaths.push(sourceUmlClass.absolutePath);
    return findImplicitImport(association, sourceUmlClass, umlClasses, searchedAbsolutePaths);
};
exports.findAssociatedClass = findAssociatedClass;
// Tests if source class can be linked to the target class via an association
const isAssociated = (association, sourceUmlClass, targetUmlClass) => {
    return (
    // class is in the same source file
    (association.targetUmlClassName === targetUmlClass.name &&
        sourceUmlClass.absolutePath === targetUmlClass.absolutePath) ||
        // imported classes with no explicit import names
        (association.targetUmlClassName === targetUmlClass.name &&
            sourceUmlClass.imports.find((i) => i.absolutePath === targetUmlClass.absolutePath &&
                i.classNames.length === 0)) ||
        // imported classes with explicit import names or import aliases
        sourceUmlClass.imports.find((i) => i.absolutePath === targetUmlClass.absolutePath &&
            i.classNames.find((importedClass) => 
            // no import alias
            (association.targetUmlClassName ===
                importedClass.className &&
                importedClass.className === targetUmlClass.name &&
                importedClass.alias == undefined) ||
                // import alias
                (association.targetUmlClassName ===
                    importedClass.alias &&
                    importedClass.className === targetUmlClass.name))));
};
const findImplicitImport = (association, sourceUmlClass, umlClasses, searchedRelativePaths) => {
    // Get all implicit imports. That is, imports that do not explicitly import contracts or interfaces.
    const implicitImports = sourceUmlClass.imports.filter((i) => i.classNames.length === 0);
    // For each implicit import
    for (const importDetail of implicitImports) {
        // Find a class with the same absolute path as the import so we can get the new imports
        const newSourceUmlClass = umlClasses.find((c) => c.absolutePath === importDetail.absolutePath);
        if (!newSourceUmlClass) {
            // Could not find a class in the import file so just move onto the next loop
            continue;
        }
        // Avoid circular imports
        if (searchedRelativePaths.includes(newSourceUmlClass.absolutePath)) {
            // Have already recursively looked for imports of imports in this file
            continue;
        }
        // TODO need to handle imports that use aliases as the association will not be found
        const umlClass = (0, exports.findAssociatedClass)(association, newSourceUmlClass, umlClasses, searchedRelativePaths);
        if (umlClass)
            return umlClass;
    }
    return undefined;
};
//# sourceMappingURL=associations.js.map