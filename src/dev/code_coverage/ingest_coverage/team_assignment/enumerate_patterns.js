/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { from } from 'rxjs';
import { map, filter, flatMap } from 'rxjs/operators';
import {
  prokGlob,
  trim,
  isRejectedDir,
  isFileAllowed,
  isDir,
  dropEmpty,
  notFound,
  tryPath,
} from './enumeration_helpers';
import { id } from '../utils';
import { stripLeading } from '../transforms';

export const enumeratePatterns = (rootPath) => (log) => (patterns) => {
  return from(patterns).pipe(map(creepOrLog(log)), filter(id), flatMap(id));

  function creepOrLog(log) {
    return ([pathPattern, team]) =>
      tryPath(stripLeading(pathPattern)).fold(notFound(log), pathExists(team));
  }

  function pathExists(owner) {
    const creeper = (x) => creepFsSync(x, [], rootPath, owner);
    return function creepAllAsGlobs(pathPattern) {
      return prokGlob(pathPattern).map(creeper).filter(dropEmpty);
    };
  }
};

function creepFsSync(aPath, xs, rootPath, owner) {
  xs = xs || [];

  const joinRoot = join.bind(null, rootPath);
  const trimRoot = trim(rootPath);
  const joined = joinRoot(aPath);
  const isADir = isDir(joined);

  (isADir ? readdirSync(joined) : [aPath]).forEach(maybeRecurse);

  return xs;

  function maybeRecurse(entry) {
    const full = isADir ? join(aPath, entry) : entry;
    const fullIsDir = statSync(full).isDirectory();

    if (fullIsDir && !isRejectedDir(full)) xs = creepFsSync(full, xs, rootPath, owner);
    else if (isFileAllowed(full)) xs.push(`${trimRoot(full)} ${owner}`);
  }
}
