/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import { Service } from '@aws-ee/base-services-container';
import { getSystemRequestContext } from '@aws-ee/base-services';

class AddWorkflows extends Service {
  constructor() {
    // eslint-disable-line no-useless-constructor
    super();
    this.dependency(['deploymentStoreService', 'workflowService', 'workflowRegistryService']);
  }

  async init() {
    await super.init();
  }

  async execute() {
    const [registryService] = await this.service(['workflowRegistryService']);

    // workflows = [ { id, v, definition }]
    const workflows = await registryService.listWorkflows();

    for (const workflow of workflows) {
      const { id, v, definition } = workflow;
      const encodedId = `${id}-${v}`;
      const definitionStr = JSON.stringify(definition);
      const existingItem = await this.findDeploymentItem({ id: encodedId });

      if (existingItem && definitionStr === existingItem.value) {
        this.log.info(`Skip workflow [${id}] v${v} "${workflow.definition.title}"`);
      } else {
        this.log.info(`Add/Update workflow [${id}] v${v} "${workflow.definition.title}"`);
        await this.createVersion(definition);
        await this.createDeploymentItem({ encodedId, definitionStr });
      }
    }
  }

  async findDeploymentItem({ id }) {
    const [deploymentStore] = await this.service(['deploymentStoreService']);
    return deploymentStore.find({ type: 'workflow', id });
  }

  async createDeploymentItem({ encodedId, definitionStr }) {
    const [deploymentStore] = await this.service(['deploymentStoreService']);

    return deploymentStore.createOrUpdate({ type: 'workflow', id: encodedId, value: definitionStr });
  }

  async createVersion(definition) {
    const [workflowService] = await this.service(['workflowService']);
    const { id, v } = definition;
    const requestContext = getSystemRequestContext();
    const existing = await workflowService.findVersion(requestContext, { id, v, fields: [] });
    if (existing) {
      const data = { ...definition, rev: existing.rev };
      return workflowService.updateVersion(requestContext, data);
    }
    return workflowService.createVersion(requestContext, definition);
  }
}

export default AddWorkflows;
