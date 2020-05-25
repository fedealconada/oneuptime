import React from 'react';
import { CrumbItem, Breadcrumbs } from 'react-breadcrumbs-dynamic';
import { PropTypes } from 'prop-types';

function BreadCrumbs({ styles }) {
    return (
        <div className={styles}>
            <Breadcrumbs
                separator={<span className="db-breadcrumb-seperator" />}
                item={CrumbItem}
                finalProps={{
                    style: {
                        fontWeight: 'bold',
                    },
                }}
                duplicateProps={{
                    to: 'href',
                }}
                compare={(a, b) => a - b}
            />
        </div>
    );
}

BreadCrumbs.displayName = 'BreadCrumbs';

BreadCrumbs.propTypes = {
    styles: PropTypes.object.isRequired,
};

export default BreadCrumbs;
