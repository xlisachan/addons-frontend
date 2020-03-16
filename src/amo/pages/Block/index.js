/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import { fetchBlock } from 'amo/reducers/block';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterMatchType } from 'core/types/router';
import type { BlockType } from 'amo/reducers/block';

import './styles.scss';

type Props = {|
  match: {
    ...ReactRouterMatchType,
    params: {| guid: string |},
  },
|};

type InternalProps = {|
  ...Props,
  block: BlockType | void | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

const CRITERIA_URL =
  'https://extensionworkshop.com/documentation/publish/add-ons-blocking-process/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=blocked-addon';
const SUPPORT_URL =
  'https://support.mozilla.org/kb/add-ons-cause-issues-are-on-blocklist';

export class BlockBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const {
      block,
      dispatch,
      errorHandler,
      match: {
        params: { guid },
      },
    } = this.props;

    if (block === undefined) {
      dispatch(fetchBlock({ errorHandlerId: errorHandler.id, guid }));
    }
  }

  render() {
    const { block, i18n } = this.props;

    if (block === null) {
      return <NotFoundPage />;
    }

    const title = i18n.gettext(`This add-on has been blocked for your
      protection.`);

    return (
      <Page>
        <div className="Block-page">
          <Helmet>
            <title>{title}</title>
          </Helmet>

          <Card className="Block" header={title}>
            <h2>{i18n.gettext('Why was it blocked?')}</h2>
            <p>
              {block ? (
                block.reason ||
                i18n.gettext(`This add-on violates Mozilla’s add-on policies.`)
              ) : (
                <LoadingText />
              )}
            </p>
            <h2>{i18n.gettext('What does this mean?')}</h2>
            <p>
              {i18n.gettext(`The problematic add-on or plugin will be
                automatically disabled and no longer usable.`)}
            </p>
            <p
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={sanitizeHTML(
                i18n.sprintf(
                  i18n.gettext(`When Mozilla becomes aware of add-ons, plugins,
                    or other third-party software that seriously compromises
                    Firefox security, stability, or performance and meets
                    %(criteriaStartLink)scertain criteria%(criteriaEndLink)s,
                    the software may be blocked from general use. For more
                    information, please read %(supportStartLink)sthis support
                    article%(supportEndLink)s.`),
                  {
                    criteriaStartLink: `<a href="${CRITERIA_URL}">`,
                    criteriaEndLink: '</a>',
                    supportStartLink: `<a href="${SUPPORT_URL}">`,
                    supportEndLink: '</a>',
                  },
                ),
                ['a'],
              )}
            />
            <p>
              {block ? (
                i18n.sprintf(
                  i18n.gettext('Versions blocked: %(min)s to %(max)s.'),
                  {
                    min: block.min_version,
                    max: block.max_version,
                  },
                )
              ) : (
                <LoadingText />
              )}
              <br />
              {block ? (
                <>
                  {i18n.sprintf(i18n.gettext('Blocked on %(date)s.'), {
                    date: i18n.moment(block.created).format('ll'),
                  })}
                  {block.url && [
                    ' ',
                    <a key={block.url} href={block.url}>
                      {i18n.gettext('View block request')}
                    </a>,
                    '.',
                  ]}
                </>
              ) : (
                <LoadingText />
              )}
            </p>
          </Card>
        </div>
      </Page>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
  ownProps: InternalProps,
): $Shape<InternalProps> => {
  const { blocks } = state;

  return {
    block: blocks.blocks[ownProps.match.params.guid],
  };
};

export const extractId = (ownProps: InternalProps) => {
  return ownProps.match.params.guid;
};

const Block: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(BlockBase);

export default Block;
