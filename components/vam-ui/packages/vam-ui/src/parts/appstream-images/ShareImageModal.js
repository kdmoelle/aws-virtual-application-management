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

import React from 'react';
import { Button, Header, Modal, Input } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import { observable, runInAction } from 'mobx';
import { displayError, displaySuccess } from '@aws-ee/base-ui/dist/helpers/notification';
import i18n from 'roddeh-i18n';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';

class ShareImageModal extends React.Component {
  constructor() {
    super();
    this.componentStore = observable({
      value: '',
      processing: false,
    });
  }

  render() {
    const processing = this.componentStore.processing;
    const disableShareButton = processing || this.componentStore.value.length < 12;

    return (
      <Modal open={this.props.open} size="tiny" onClose={this.props.onCancel} closeOnDimmerClick={!processing}>
        <Header content={i18n(keys.SHARE_IMAGE)} />
        <Modal.Content>
          <Input
            label={i18n(keys.SHARE_IMAGE_MESSAGE)}
            disabled={processing}
            type="text"
            onKeyPress={this.validate}
            maxLength="12"
            value={this.componentStore.value}
            onChange={e => {
              runInAction(() => {
                this.componentStore.value = e.target.value;
              });
            }}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            disabled={processing}
            onClick={() => {
              this.reset();
              this.props.onCancel();
            }}
          >
            {i18n(baseKeys.CANCEL)}
          </Button>
          <Button loading={processing} disabled={disableShareButton} color="blue" onClick={() => this.handleShare()}>
            {i18n(keys.SHARE_IMAGE)}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  reset() {
    runInAction(() => {
      this.componentStore.value = '';
      this.componentStore.processing = false;
    });
  }

  validate(event) {
    const key = event.key;
    const regex = /[0-9]/;
    if (!regex.test(key)) {
      event.returnValue = false;
      if (event.preventDefault) event.preventDefault();
    }
  }

  async handleShare() {
    runInAction(() => {
      this.componentStore.processing = true;
    });
    const value = this.componentStore.value;
    try {
      const accountId = value;
      await this.props.appstreamImage.shareWithAwsAccount(accountId);
      displaySuccess(i18n(keys.SHARE_SUCCESS), i18n(keys.SHARED));
      this.reset();
      if (this.props.onSuccess && typeof this.props.onSuccess === 'function') {
        this.props.onSuccess();
      }
    } catch (error) {
      displayError(error);
      runInAction(() => {
        this.componentStore.processing = false;
      });
    }
  }
}

export default observer(ShareImageModal);
