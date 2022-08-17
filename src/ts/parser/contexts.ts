import {
  attrLabel,
  attrListLabel,
  attrNameLabel,
  attrValueLabel,
  bidirectionalArrowLabel,
  bidirectionalDeepArrowLabel,
  deepArrowLabel,
  diagramLabel,
  directedArrowLabel,
  dotLabel,
  edgeLabel,
  elementLabel,
  elementsLabel,
  equalLabel,
  groupLabel,
  idLabel,
  linkLabel,
  nodeLabel,
  normalIdentifierLabel,
  providerLabel,
  quotedIdentifierLabel,
  semicolonLabel,
  serviceLabel,
} from './labels';
import {CstNode, IToken} from '@chevrotain/types';

export type IdentifierContext = {[normalIdentifierLabel]: IToken[]} | {[quotedIdentifierLabel]: IToken[]};

export type NodeContext = {
  [providerLabel]: IToken[];
  [dotLabel]: IToken[];
  [serviceLabel]: IToken[];
  [idLabel]: CstNode[];
  [attrListLabel]?: CstNode[];
  [semicolonLabel]: IToken[];
};

export type EdgeContext = {
  [idLabel]: CstNode[];
  [linkLabel]: CstNode[];
  [attrListLabel]?: CstNode[];
  [semicolonLabel]: IToken[];
};

export type GroupContext = {
  [groupLabel]: IToken[];
  [idLabel]: CstNode[];
  [attrListLabel]?: CstNode[];
  [elementsLabel]: CstNode[];
};

export type ElementContext = {
  [nodeLabel]: CstNode[];
  [edgeLabel]: CstNode[];
  [groupLabel]: CstNode[];
};

export type ElementsContext = {
  [elementLabel]?: CstNode[];
};

export type LinkContext = {
  [directedArrowLabel]: IToken[];
  [bidirectionalArrowLabel]: IToken[];
  [deepArrowLabel]: IToken[];
  [bidirectionalDeepArrowLabel]: IToken[];
};

export type AttributeContext = {
  [attrNameLabel]: IToken[];
  [equalLabel]: IToken[];
  [attrValueLabel]: CstNode[];
};

export type AttributeListContext = {
  [attrLabel]: CstNode[];
};

export type DiagramContext = {
  [diagramLabel]: IToken[];
  [idLabel]: CstNode[];
  [attrListLabel]?: CstNode[];
  [elementsLabel]: CstNode[];
};
