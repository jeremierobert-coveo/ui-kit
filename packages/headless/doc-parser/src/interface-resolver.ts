import {
  ApiEntryPoint,
  ApiInterface,
  ApiItem,
  ApiItemKind,
  ApiMethodSignature,
  ApiPropertySignature,
  ApiTypeAlias,
  Excerpt,
  ExcerptToken,
  ExcerptTokenKind,
  Parameter,
} from '@microsoft/api-extractor-model';
import {DocComment} from '@microsoft/tsdoc';
import {findApi} from './api-finder';
import {AnyEntity, Entity} from './entity';
import {
  buildEntity,
  buildFuncEntity,
  buildObjEntity,
  buildParamEntity,
} from './entity-builder';

export function resolveInterfaceMembers(
  entry: ApiEntryPoint,
  apiInterface: ApiInterface
): AnyEntity[] {
  return apiInterface.members.map((m) => {
    if (isPropertySignature(m)) {
      return resolvePropertySignature(entry, m);
    }

    if (isMethodSignature(m)) {
      return resolveMethodSignature(entry, m);
    }

    throw new Error(`Unsupported member: ${m.displayName}`);
  });
}

function isPropertySignature(item: ApiItem): item is ApiPropertySignature {
  return item.kind === ApiItemKind.PropertySignature;
}

function resolvePropertySignature(
  entry: ApiEntryPoint,
  p: ApiPropertySignature
) {
  const typeExcerpt = p.propertyTypeExcerpt.spannedTokens[0];

  if (isRecordType(typeExcerpt)) {
    return buildEntityFromProperty(p);
  }

  if (isTypeAlias(typeExcerpt)) {
    return buildEntityFromPropertyAndResolveTypeAlias(entry, p);
  }

  if (isReference(typeExcerpt)) {
    return buildObjEntityFromProperty(entry, p);
  }

  return buildEntityFromProperty(p);
}

function isTypeAlias(token: ExcerptToken) {
  const meaning = token.canonicalReference?.symbol?.meaning;
  return meaning === 'type';
}

function isRecordType(token: ExcerptToken) {
  const isRecord = token.text === 'Record';
  return isReference(token) && isRecord;
}

function isReference(token: ExcerptToken) {
  return token.kind === ExcerptTokenKind.Reference;
}

function buildEntityFromProperty(p: ApiPropertySignature) {
  return buildEntity({
    name: p.name,
    comment: (p.tsdocComment as unknown) as DocComment,
    isOptional: p.isOptional,
    type: p.propertyTypeExcerpt.text,
  });
}

function buildObjEntityFromProperty(
  entry: ApiEntryPoint,
  p: ApiPropertySignature
) {
  const {typeName, typeNameWithGenerics} = extractTypeName(
    p.propertyTypeExcerpt
  );
  const apiInterface = findApi(entry, typeName) as ApiInterface;
  const members = resolveInterfaceMembers(entry, apiInterface);
  const entity = buildEntityFromProperty(p);

  return buildObjEntity({entity, members, typeName: typeNameWithGenerics});
}

function buildEntityFromPropertyAndResolveTypeAlias(
  entry: ApiEntryPoint,
  p: ApiPropertySignature
): Entity {
  const entity = buildEntityFromProperty(p);
  const alias = extractTypeName(p.propertyTypeExcerpt);
  const typeAlias = findApi(entry, alias.typeName) as ApiTypeAlias;
  const type = typeAlias.typeExcerpt.text;

  return {...entity, type};
}

function isMethodSignature(m: ApiItem): m is ApiMethodSignature {
  return m.kind === ApiItemKind.MethodSignature;
}

function resolveMethodSignature(entry: ApiEntryPoint, m: ApiMethodSignature) {
  const params = m.parameters.map((p) => resolveParameter(entry, p));
  const returnType = m.returnTypeExcerpt.text;

  return buildFuncEntity({
    name: m.displayName,
    comment: (m.tsdocComment as unknown) as DocComment,
    params,
    returnType,
  });
}

export function resolveParameter(entry: ApiEntryPoint, p: Parameter) {
  const typeExcerpt = p.parameterTypeExcerpt.spannedTokens[0];

  if (isTypeAlias(typeExcerpt)) {
    return buildEntityFromParamAndResolveTypeAlias(entry, p);
  }

  if (isReference(typeExcerpt)) {
    return buildObjEntityFromParam(entry, p);
  }

  return buildParamEntity(p);
}

function buildEntityFromParamAndResolveTypeAlias(
  entry: ApiEntryPoint,
  p: Parameter
): Entity {
  const entity = buildParamEntity(p);
  const alias = extractTypeName(p.parameterTypeExcerpt);
  const typeAlias = findApi(entry, alias.typeName) as ApiTypeAlias;
  const type = typeAlias.typeExcerpt.text;

  return {...entity, type};
}

function buildObjEntityFromParam(entryPoint: ApiEntryPoint, p: Parameter) {
  const {typeName, typeNameWithGenerics} = extractTypeName(
    p.parameterTypeExcerpt
  );
  const apiInterface = findApi(entryPoint, typeName) as ApiInterface;
  const members = resolveInterfaceMembers(entryPoint, apiInterface);
  const entity = buildParamEntity(p);

  return buildObjEntity({entity, members, typeName: typeNameWithGenerics});
}

function extractTypeName(excerpt: Excerpt) {
  const typeName = excerpt.spannedTokens[0].text;
  const typeNameWithGenerics = excerpt.spannedTokens
    .map((token) => token.text)
    .join('')
    .replace(/\[\]/, '');
  return {typeName, typeNameWithGenerics};
}
